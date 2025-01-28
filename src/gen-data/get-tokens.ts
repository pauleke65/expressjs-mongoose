'use server';

import { TokenDataInfo, UserTokenInfo } from './types';
import {
  getTokenDatas,
  getUserTokensDB,
  storeTokenData,
  storeUserTokens,
} from './db';
import { SOLCAN_API_TOKEN } from './constants';

async function getPriceData(tokenIds: string[]) {
  const priceResponse = await fetch(
    `https://api.jup.ag/price/v2?ids=${tokenIds.join(',')}`,
  );
  return (await priceResponse.json()).data;
}

export async function getTokens(
  addresses: string[],
  bypassFetch?: boolean,
): Promise<Record<string, any>> {
  if (addresses.length === 0) {
    return {};
  }
  try {
    // Step 1: Fetch tokens from the database
    const tokensFromDb = await getTokenDatas(addresses); // Function to get tokens from DB
    const tokensFound = new Set(
      (tokensFromDb ?? []).map((token: TokenDataInfo) => token.id),
    );

    // Step 2: Determine missing tokens
    const missingTokens = bypassFetch
      ? addresses
      : addresses.filter((address) => !tokensFound.has(address));

    let tokensFromApi: any[] = [];

    // Step 3: If there are missing tokens, fetch them from the API
    if (missingTokens.length > 0) {
      const response = await fetch(`https://api.solana.fm/v0/tokens`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hydration: {
            accountHash: true,
          },
          tokenHashes: missingTokens,
        }),
      });

      const priceData = await getPriceData(missingTokens);

      const data = await response.json();

      tokensFromApi = bypassFetch
        ? missingTokens.map((item) => ({
            id: item,
            price: parseFloat(priceData[item]?.price ?? '0'),
          }))
        : (data.result ?? []).map((item: any) => ({
            id: item.tokenHash,
            price: parseFloat(priceData[item.id]?.price ?? '0'),
            ...item.data,
          }));

      // Step 4: Store fetched tokens in the database
      await storeTokenData(tokensFromApi);
    }

    // Step 5: Combine tokens from DB and API
    const combinedTokens = [...(tokensFromDb ?? []), ...tokensFromApi];

    // Step 6: Create the response object with tokenHash as keys
    const dataToReturn: Record<string, any> = {};
    combinedTokens.forEach((token) => {
      dataToReturn[token.id] = { ...token };
    });

    return dataToReturn;
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return {};
  }
}

export async function getUserTokens(address: string): Promise<{
  priceData: Record<string, any>;
  tokens: UserTokenInfo[];
}> {
  const res = await getUserTokensDB(address);
  if (res) {
    const priceData: any = {};

    res.tokens.forEach((token: any) => {
      priceData[token.id] = { ...token };
    });

    return {
      priceData,
      tokens: res.tokens,
    };
  }

  const tokens: UserTokenInfo[] = [];

  try {
    const requestOptions = {
      method: 'get',
      headers: { token: SOLCAN_API_TOKEN },
    };
    const response = await fetch(
      `https://pro-api.solscan.io/v2.0/account/token-accounts?address=${address}&type=token&page=1&page_size=40`,
      requestOptions,
    );

    const data = await response.json();

    const tokensMeta = data.metadata.tokens;

    if (!tokensMeta) {
      return { priceData: {}, tokens };
    }

    const tokensList = Object.keys(tokensMeta);

    const priceData = await getTokens(tokensList, true);

    data.data.forEach((item: any) => {
      const amountInUSD =
        (item.amount / 10 ** item.token_decimals) *
        parseFloat(priceData[item.token_address]?.price ?? '0');

      tokens.push({
        account: item.token_account,
        address: item.token_address,
        amount: item.amount,
        decimals: item.token_decimals,
        name: tokensMeta[item.token_address].token_name,
        symbol: tokensMeta[item.token_address].token_symbol,
        icon: tokensMeta[item.token_address].token_icon,
        price: parseFloat(priceData[item.token_address]?.price ?? '0'),
        amountInUSD: Number.isNaN(parseFloat(amountInUSD.toString()))
          ? 0
          : amountInUSD,
      });
    });

    tokens.sort((a, b) => b.amountInUSD - a.amountInUSD);

    await storeUserTokens(address, tokens);

    return { priceData, tokens };
  } catch (error) {
    console.error(error);
    return { priceData: {}, tokens };
  }
}
