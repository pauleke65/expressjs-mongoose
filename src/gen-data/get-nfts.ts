'use server';
import { getUserNFTs, storeUserNFTs } from './db';
import { SOLCAN_API_TOKEN } from './constants';
import { NFTInfo } from './types';

export async function getNFTs(address: string): Promise<NFTInfo[]> {
  const res = await getUserNFTs(address);
  if (res) {
    return res.nfts;
  }

  const nfts: NFTInfo[] = [];

  try {
    const requestOptions = {
      method: 'get',
      headers: { token: SOLCAN_API_TOKEN },
    };
    const response = await fetch(
      `https://pro-api.solscan.io/v2.0/account/token-accounts?address=${address}&type=nft&page=1&page_size=10`,
      requestOptions,
    );

    const data = await response.json();

    data.data.forEach((item: any) => {
      const token =
        data.metadata.tokens[
          item.token_address as keyof typeof data.metadata.tokens
        ];
      if (token.token_name && token.token_icon && token.token_name.length > 0 &&   token.token_icon.length > 0) {
        nfts.push({
          id: item.token_address,
          name: token.token_name,
          symbol: token.token_symbol,
          icon: token.token_icon,
          amount: item.amount,
          account: item.owner,
          decimals: item.token_decimals,
        });
      }
    });

    nfts.sort((a, b) => b.amount - a.amount);

    await storeUserNFTs(address, nfts);

    return nfts;
  } catch (error) {
    console.error(error);
    return nfts;
  }
}
