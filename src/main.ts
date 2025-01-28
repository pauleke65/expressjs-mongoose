import { top100TokensByPrice } from './data/top-100-tokens';
import { topTrendingTokens } from './data/top-trending-tokens';
import { ITokenHolder, TokenHolderModel } from './models/token-holder'; // Import your MongoDB model

async function saveTokenHoldersToMongoDB(holders: ITokenHolder[]) {
  try {
    await TokenHolderModel.insertMany(holders); // Save multiple holders to MongoDB
    console.log(`Saved ${holders.length} holders`);
  } catch (error) {
    console.error('Error saving holders:', error);
  }
}

const tokens = [...top100TokensByPrice, ...topTrendingTokens];

const simplifiedTokens = tokens.reduce<
  { name: string; address: string; symbol: string }[]
>((acc, token) => {
  const { name, address, symbol } = token;
  if (!acc.some((t) => t.address === address)) {
    acc.push({ name, address, symbol });
  } else {
    console.log('duplicate', { name, address, symbol });
  }
  return acc;
}, []);

console.log(simplifiedTokens.length);
console.log(simplifiedTokens[0]);

const requestOptions = {
  method: 'get',
  headers: {
    token: process.env.SOLCAN_API_TOKEN as string,
  },
};

async function getTop100Holders(address: string, symbol: string) {
  let holders: ITokenHolder[] = [];

  for (let page = 1; holders.length < 200; page++) {
    const response = await fetch(
      `https://pro-api.solscan.io/v2.0/token/holders?address=${address}&page=${page}&page_size=40`,
      requestOptions,
    ).then((res) => res.json());

    if (!response.data || response.data.items.length === 0) {
      console.log(
        `Error on ${address} page ${page} with ${
          response.status
        } holders length: ${holders.length} - Full response: ${JSON.stringify(
          response,
        )}`,
      );
      break;
    }
    holders = holders.concat(
      response.data.items.map((item: any) => ({ ...item, symbol })),
    );
  }

  return holders;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function main() {
  const totalTokens = tokens.length;
  let processedTokens = 0;

  for (const token of tokens) {
    const holders = await getTop100Holders(token.address, token.symbol);

    // Save each token holder to MongoDB
    await saveTokenHoldersToMongoDB(holders);

    processedTokens++;
    console.log(`Processed ${processedTokens} of ${totalTokens} tokens.`);

    // Enforce the 10 requests/minute limit
    if (processedTokens < totalTokens) {
      console.log('Waiting 6 seconds before the next request...');
      await delay(6000); // 6,000 ms = 6 seconds
    }
  }

  console.log(`All ${totalTokens} tokens have been processed.`);
}
