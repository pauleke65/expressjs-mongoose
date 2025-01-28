// import { top100TokensByPrice } from './data/top-100-tokens';
// import { topTrendingTokens } from './data/top-trending-tokens';
// import { ITokenHolder, TokenHolderModel } from './models/token-holder'; // Import your MongoDB model

// async function saveTokenHoldersToMongoDB(holders: ITokenHolder[]) {
//   try {
//     await TokenHolderModel.insertMany(holders); // Save multiple holders to MongoDB
//     console.log(`Saved ${holders.length} holders`);
//   } catch (error) {
//     console.error('Error saving holders:', error);
//   }
// }

// const tokens = [...top100TokensByPrice, ...topTrendingTokens];

// const simplifiedTokens = tokens.reduce<
//   { name: string; address: string; symbol: string }[]
// >((acc, token) => {
//   const { name, address, symbol } = token;
//   if (!acc.some((t) => t.address === address)) {
//     acc.push({ name, address, symbol });
//   } else {
//     console.log('duplicate', { name, address, symbol });
//   }
//   return acc;
// }, []);

// console.log(simplifiedTokens.length);
// console.log(simplifiedTokens[0]);

// const requestOptions = {
//   method: 'get',
//   headers: {
//     token: process.env.SOLCAN_API_TOKEN as string,
//   },
// };

// async function getTop100Holders(address: string, symbol: string) {
//   let holders: ITokenHolder[] = [];

//   for (let page = 1; holders.length < 200; page++) {
//     const response = await fetch(
//       `https://pro-api.solscan.io/v2.0/token/holders?address=${address}&page=${page}&page_size=40`,
//       requestOptions,
//     ).then((res) => res.json());

//     if (!response.data || response.data.items.length === 0) {
//       console.log(
//         `Error on ${address} page ${page} with ${
//           response.status
//         } holders length: ${holders.length} - Full response: ${JSON.stringify(
//           response,
//         )}`,
//       );
//       break;
//     }
//     holders = holders.concat(
//       response.data.items.map((item: any) => ({ ...item, symbol })),
//     );
//   }

//   return holders;
// }

// function delay(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// export async function main() {
//   const totalTokens = tokens.length;
//   let processedTokens = 0;

//   for (const token of tokens) {
//     const holders = await getTop100Holders(token.address, token.symbol);

//     // Save each token holder to MongoDB
//     await saveTokenHoldersToMongoDB(holders);

//     processedTokens++;
//     console.log(`Processed ${processedTokens} of ${totalTokens} tokens.`);

//     // Enforce the 10 requests/minute limit
//     if (processedTokens < totalTokens) {
//       console.log('Waiting 6 seconds before the next request...');
//       await delay(6000); // 6,000 ms = 6 seconds
//     }
//   }

//   console.log(`All ${totalTokens} tokens have been processed.`);
// }

// import { TokenHolderModel } from './models/token-holder'; // Assuming TokenHolderModel is already defined
// import './lib/db';

// async function getUniqueAddresses() {

//   await new Promise(resolve => setTimeout(resolve, 5000));
//   try {
//     const pageSize = 1000; // Number of records per query
//     let page = 0;
//     let uniqueAddresses = new Set();

//     let totalItemsRetrieved = 0;
//     while (true) {
//       const holders = await TokenHolderModel.find({}, { address: 1 })
//         .skip(page * pageSize)
//         .limit(pageSize)
//         .exec();

//       if (holders.length === 0) break;

//       holders.forEach((holder) => {
//         uniqueAddresses.add(holder.address);
//         totalItemsRetrieved++;
//       });
//       console.log(
//         `Loop count: ${page}, Total items retrieved: ${totalItemsRetrieved}`,
//       );
//       page++;
//     }

//     const fs = require('fs');
//     const path = require('path');

//     const uniqueAddressesArray = Array.from(uniqueAddresses);
//     const data = JSON.stringify(uniqueAddressesArray);

//     const filePath = path.join(__dirname, 'unique_addresses.json');
//     fs.writeFileSync(filePath, data);

//     console.log(`Unique addresses stored in ${filePath}.`);

//     return uniqueAddresses;
//   } catch (error) {
//     console.error('Error retrieving unique addresses:', error);
//   }
// }

// getUniqueAddresses();

import { generateData } from './gen-data';
import './gen-data/db';

const fs = require('fs');
const path = require('path');

// Path to the existing 'unique_addresses.json' file

export async function main() {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const filePath = path.join(__dirname, 'unique_addresses.json');

  // Read the JSON file
  let uniqueAddresses;
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    uniqueAddresses = JSON.parse(data);
  } catch (err) {
    console.error('Error reading the JSON file:', err);
  }

  // Count the number of unique addresses
  console.log('Starting to generate data for unique addresses...');
  for (let i = 0; i < uniqueAddresses.length; i++) {
    const address = uniqueAddresses[i];
    const res = await generateData(address);
    if (res) {
      console.log(
        `Data generated for items ${i + 1} of ${uniqueAddresses.length}`,
      );
    } else {
      console.log(`Data not generated for address: ${address}`);
    }
  }
  console.log('Data generation for unique addresses completed.');
}
