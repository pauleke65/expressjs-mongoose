'use server';

import { getUserTransactions, storeUserTransactions } from './db';
import { HELIUS_API_KEY, MAX_TRANSACTIONS } from './constants';
import { TransactionData } from './types';
import { generateUniqueUsername } from './username-generator';

function transactionIsInThisYear(timestamp: number): boolean {
  // Get timestamp for start of this year (Jan 1, 00:00:00)
  const timestampForThisYear =
    new Date(new Date().getFullYear(), 0, 1, 0, 0, 0).getTime() / 1000;

  // Get timestamp for end of this year (Dec 31, 23:59:59)
  const timestampForEndOfYear =
    new Date(new Date().getFullYear(), 11, 31, 23, 59, 59).getTime() / 1000;

  // Return true if timestamp falls within this year's range
  return (
    timestamp >= timestampForThisYear && timestamp <= timestampForEndOfYear
  );
}

async function getTransactions(
  address: string,
  lastSignature?: string,
): Promise<TransactionData[]> {
  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}${
        lastSignature ? `&before=${lastSignature}` : ''
      }&limit=100`,
      {
        method: 'GET',
        headers: {},
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

export async function getSolanaUsername(address: string): Promise<string> {
  try {
    const response = await fetch(
      `https://sns-api.bonfida.com/v2/user/domains/${address}`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
      },
    );

    const data = await response.json();

    return (data[address]?.length ?? 0) > 0
      ? `${data[address][0]}.sol`
      : generateUniqueUsername().toLowerCase();
  } catch (error) {
    console.error('Error fetching username:', error);

    return generateUniqueUsername().toLowerCase();
  }
}
export async function getTransactionsForYear(address: string): Promise<{
  username: string;
  transactions: TransactionData[];
}> {
  const res = await getUserTransactions(address);

  if (res && res.transactions.length > 0) {
    return {
      username: res.username,
      transactions: res.transactions,
    };
  }

  const username = await getSolanaUsername(address);

  const allTransactions = new Array<any>();
  while (allTransactions.length < MAX_TRANSACTIONS) {
    const data = await getTransactions(
      address,
      allTransactions[allTransactions.length - 1]?.signature,
    );

    if (data.length === 0) {
      break;
    }

    const firstTxnNotInYearIndex = data.findIndex(
      (t: any) => !transactionIsInThisYear(t.timestamp),
    );
    const firstTxnNotInYear =
      firstTxnNotInYearIndex >= 0 ? data[firstTxnNotInYearIndex] : null;

    if (firstTxnNotInYear) {
      // const firstTxnOfYearIndex = firstTxnNotInYearIndex - 1;

      if (firstTxnNotInYearIndex === 0) {
        allTransactions.push(...data);
      } else {
        allTransactions.push(...data.slice(0, firstTxnNotInYearIndex));
      }
      break;
    }

    allTransactions.push(...data);
  }

  // await storeUserTransactions(address, username!, allTransactions);

  return {
    username,
    transactions: allTransactions,
  };
}
