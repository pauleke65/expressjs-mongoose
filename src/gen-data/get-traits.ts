'use server';

import { PROGRAM_SOL_ADDRESS } from './constants';
import { allCliqs } from './data/cliqs';
import { solanaPrograms } from './data/programs';
import { getUserTokens } from './get-tokens';
import { getDateFromTimestamp, lamportsToSol } from './sol-utils';
import {
  AirdropInfo,
  MintPriceAmount,
  SOLTransfers,
  SwapInfo,
  TokenInfo,
  TransactionData,
  UserCliq,
} from './types';

function createTokenInfo(mint: string): TokenInfo {
  return {
    id: mint,
    name: mint,
    symbol: mint,
    count: 1,
  };
}

function updateTokenCounts(
  existingTokens: TokenInfo[],
  newToken: TokenInfo | undefined,
): TokenInfo[] {
  if (!newToken) return existingTokens;

  const existingToken = existingTokens.find((t) => t.id === newToken.id);
  if (existingToken) {
    return existingTokens.map((t) =>
      t.id === newToken.id ? { ...t, count: t.count + 1 } : t,
    );
  }
  return [...existingTokens, newToken];
}

// Helper function to process swap transactions
function processSwapTransaction(item: TransactionData, swaps: SwapInfo[]) {
  const swap = swaps.find((s) => s.type === item.type && s.id === item.source);

  // Extract token information from the swap
  let { fromToken, toToken } = extractSwapTokens(item);

  if (!swap) {
    // Create new swap entry if none exists
    const icon =
      Object.values(solanaPrograms).find((program) =>
        program.title.toLowerCase().includes(item.source.toLowerCase()),
      )?.icon ||
      solanaPrograms.Stake11111111111111111111111111111111111111.icon;
    swaps.push({
      icon,
      id: item.source!,
      name: 'name',
      type: item.type,
      fromTokensCount: fromToken ? [fromToken] : [],
      toTokensCount: toToken ? [toToken] : [],
      transactions: [item],
    });
  } else {
    // Update existing swap entry
    updateExistingSwap(swap, fromToken, toToken, item, swaps);
  }
}

// Helper function to extract tokens involved in a swap
function extractSwapTokens(item: TransactionData) {
  let fromToken: TokenInfo | undefined = undefined;
  let toToken: TokenInfo | undefined = undefined;

  if (item.tokenTransfers?.length > 0) {
    const firstTransfer = item.tokenTransfers[0];
    const lastTransfer =
      item.tokenTransfers.length > 1
        ? item.tokenTransfers[item.tokenTransfers.length - 1]
        : undefined;

    if (!firstTransfer.mint) {
      fromToken = createTokenInfo(PROGRAM_SOL_ADDRESS);
    }

    if (!lastTransfer?.mint && lastTransfer) {
      toToken = createTokenInfo(PROGRAM_SOL_ADDRESS);
    }

    if (firstTransfer.mint !== PROGRAM_SOL_ADDRESS) {
      fromToken = createTokenInfo(firstTransfer.mint);
    }
    if (firstTransfer.mint === PROGRAM_SOL_ADDRESS && lastTransfer) {
      toToken = createTokenInfo(lastTransfer.mint);
    }
  }

  return { fromToken, toToken };
}

// Helper function to update existing swap information
function updateExistingSwap(
  swap: SwapInfo,
  fromToken: TokenInfo | undefined,
  toToken: TokenInfo | undefined,
  item: TransactionData,
  swaps: SwapInfo[],
) {
  const updatedSwap = {
    ...swap,
    fromTokensCount: updateTokenCounts(swap.fromTokensCount, fromToken),
    toTokensCount: updateTokenCounts(swap.toTokensCount, toToken),
    transactions: [...swap.transactions, item],
  };

  const swapIndex = swaps.findIndex(
    (s) => s.type === swap.type && s.id === swap.id,
  );
  swaps[swapIndex] = updatedSwap;
}

// Helper function to process airdrop transactions
function processAirdrops(
  item: TransactionData,
  address: string,
  airdrops: AirdropInfo[],
) {
  airdrops.push({
    lamportAmount: item.nativeTransfers.reduce(
      (sum, transfer) =>
        transfer.toUserAccount === address ? sum + transfer.amount : sum,
      0,
    ),
    ...item,
  });
}

// Helper function to check if transaction is a user SOL transfer
function isUserSOLTransfer(item: TransactionData, address: string): boolean {
  return (
    item.feePayer === address &&
    ((item.tokenTransfers.length > 0 &&
      item.tokenTransfers[0].fromUserAccount === address) ||
      (item.nativeTransfers.length > 0 &&
        item.nativeTransfers[0].fromUserAccount === address))
  );
}

function updateTransfersPerMint(
  item: TransactionData,
  priceData: Record<string, { price: string }>,
  transfersPerMint: MintPriceAmount[],
): MintPriceAmount[] {
  const { fromToken, toToken } = extractSwapTokens(item);

  // Function to find or create a MintPriceAmount entry for a given token ID
  const findOrCreateEntry = (
    id: string,
    amount: number,
    amountInUSD: number,
  ): void => {
    const existingEntry = transfersPerMint.find((entry) => entry.id === id);

    if (existingEntry) {
      // Update the existing entry
      existingEntry.amount += amount;
      existingEntry.amountInUSD += amountInUSD;
    } else {
      // Add a new entry
      transfersPerMint.push({
        id,
        amount,
        amountInUSD,
      });
    }
  };

  const amount =
    item.tokenTransfers.length > 0
      ? item.tokenTransfers[0].tokenAmount
      : item.nativeTransfers[0].amount;

  if (fromToken) {
    const amountInUSD =
      amount * parseFloat(priceData[fromToken.id]?.price ?? '0');
    findOrCreateEntry(fromToken.id, amount, amountInUSD);
  }

  if (toToken) {
    const amountInUSD =
      amount * parseFloat(priceData[toToken.id]?.price ?? '0');
    findOrCreateEntry(toToken.id, amount, amountInUSD);
  }

  return transfersPerMint;
}

// Helper function to process SOL transfers
function processSolTransfer(
  item: TransactionData,
  solTransfers: SOLTransfers | undefined,
  priceData: Record<string, any>,
) {
  let { fromToken, toToken } = extractSwapTokens(item);

  if (solTransfers) {
    // Update existing SOL transfers record
    solTransfers.transfers.push(item);

    solTransfers.fromTokensCount = updateTokenCounts(
      solTransfers.fromTokensCount,
      fromToken,
    );
    solTransfers.toTokensCount = updateTokenCounts(
      solTransfers!.toTokensCount,
      toToken,
    );

    solTransfers.totalSol +=
      item.nativeTransfers.length > 0 ? item.nativeTransfers[0].amount : 0;
    if (
      solTransfers.highestTransfer.nativeTransfers.length > 0 &&
      item.nativeTransfers.length > 0 &&
      solTransfers.highestTransfer.nativeTransfers[0].amount <
        item.nativeTransfers[0].amount
    ) {
      solTransfers.highestTransfer = item;
    }
    solTransfers.transfersPerMint = updateTransfersPerMint(
      item,
      priceData,
      solTransfers.transfersPerMint,
    );
  } else {
    // Create new SOL transfers record
    solTransfers = {
      transfers: [item],
      totalSol:
        item.nativeTransfers.length > 0 ? item.nativeTransfers[0].amount : 0,
      highestTransfer: item,
      fromTokensCount: fromToken ? [fromToken] : [],
      toTokensCount: toToken ? [toToken] : [],
      transfersPerMint: updateTransfersPerMint(item, priceData, []),
    };
  }

  return solTransfers;
}

function getBusiestMonth(data: TransactionData[]): {
  month: string;
  count: number;
} {
  const monthCounts = Array(12).fill(0);

  data.forEach((item) => {
    const month = new Date(item.timestamp * 1000).getMonth();
    monthCounts[month]++;
  });

  let busiestMonth = 0;
  let maxCount = 0;

  monthCounts.forEach((count, month) => {
    if (count > maxCount) {
      maxCount = count;
      busiestMonth = month;
    }
  });

  const monthAsString = new Date(2024, busiestMonth).toLocaleString('default', {
    month: 'long',
  });

  return { month: monthAsString, count: maxCount };
}

function getBusiestDay(data: TransactionData[]): {
  date: string;
  count: number;
} {
  const dayCounts = new Map<string, number>();

  data.forEach((item) => {
    const dateString = getDateFromTimestamp(item.timestamp);
    dayCounts.set(dateString, (dayCounts.get(dateString) || 0) + 1);
  });

  let busiestDate = '';
  let maxCount = 0;

  dayCounts.forEach((count, dateString) => {
    if (count > maxCount) {
      maxCount = count;
      busiestDate = dateString;
    }
  });

  return { date: busiestDate, count: maxCount };
}

function getLongestDailyStreak(data: TransactionData[]): {
  startDate: string;
  length: number;
} {
  // Create a Set of dates with transactions
  const activeDays = new Set(
    data.map(
      (item) => new Date(item.timestamp * 1000).toISOString().split('T')[0],
    ),
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let currentStart = '';
  let longestStart = '';

  // Convert Set to sorted array of dates
  const sortedDates = Array.from(activeDays).sort();

  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const nextDate =
      i < sortedDates.length - 1 ? new Date(sortedDates[i + 1]) : null;

    if (i === 0) {
      currentStreak = 1;
      currentStart = sortedDates[i];
    } else {
      // Check if next date is consecutive
      if (nextDate) {
        const diffDays =
          (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          currentStreak++;
        } else {
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
            longestStart = currentStart;
          }
          currentStreak = 1;
          currentStart = sortedDates[i + 1];
        }
      }
    }
  }

  // Check one last time in case the longest streak was the last one
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
    longestStart = currentStart;
  }

  return { startDate: longestStart, length: longestStreak };
}

export async function assignCliqs(data: TransactionData[]) {
  const result: UserCliq[] = [];

  data.forEach((item) => {
    const action = allCliqs.find((a) => a.types.includes(item.type));
    if (action) {
      const existing = result.find((r) => r.name === action.name);
      if (existing) {
        existing.count++;
        existing.transactionSignatures.push(item.signature);
      } else {
        result.push({
          id: action.id,
          name: action.name,
          description: action.description,
          characteristic: action.characteristic,
          count: 1,
          transactionSignatures: [item.signature],
        });
      }
    }
  });

  result.sort((a, b) => b.count - a.count);
  return result;
}

export async function getTraits(address: string, data: any[]) {
  // Initialize collections to store different types of transaction traits
  const types = new Set<string>(); // Unique transaction types
  const swapDesc = new Array<string>(); // Descriptions of swap transactions
  const sources = new Set<string>(); // Unique transaction sources
  const swaps = new Array<SwapInfo>(); // Detailed swap transaction info
  const airdrops = new Array<AirdropInfo>(); // Airdrop transaction info
  let singleSolTransfersFromMe: SOLTransfers | undefined; // SOL transfer details
  let singleSolTransfersToMe: SOLTransfers | undefined; // SOL transfer details

  const { priceData, tokens: userTokens } = await getUserTokens(address);

  let lowestGasFeePaid = Infinity; // Initialize to a very high value
  let highestGasFeePaid = 0; // Initialize to 0 for the highest value

  // Process each transaction to extract traits
  data.forEach((item: TransactionData) => {
    types.add(item.type);
    sources.add(item.source);
    swapDesc.push(item.description);

    // Handle swap-related traits
    processSwapTransaction(item, swaps);

    // Process potential airdrops
    // Airdrops typically have no token transfers but multiple native transfers
    if (item.tokenTransfers.length == 0 && item.nativeTransfers.length > 1) {
      processAirdrops(item, address, airdrops);
    }

    // Process SOL transfers
    // These are direct SOL transfers where the user is both fee payer and sender

    if (item.type === 'TRANSFER' && item.nativeTransfers.length <= 1) {
      // Means it's single transfer
      if (isUserSOLTransfer(item, address)) {
        singleSolTransfersFromMe = processSolTransfer(
          item,
          singleSolTransfersFromMe,
          priceData,
        );
      } else {
        singleSolTransfersToMe = processSolTransfer(
          item,
          singleSolTransfersToMe,
          priceData,
        );
      }
    }

    if (item.feePayer === address && item.fee) {
      lowestGasFeePaid = Math.min(lowestGasFeePaid, item.fee);
      highestGasFeePaid = Math.max(highestGasFeePaid, item.fee);
    }
  });

  // Optional: Handle the case where no fees are recorded
  if (lowestGasFeePaid === Infinity) {
    lowestGasFeePaid = 0; // Set to 0 if no valid fees were found
  }
  singleSolTransfersFromMe?.transfersPerMint.sort(
    (a, b) => b.amountInUSD - a.amountInUSD,
  );
  singleSolTransfersToMe?.transfersPerMint.sort(
    (a, b) => b.amountInUSD - a.amountInUSD,
  );

  const cliqs = await assignCliqs(data);

  const busiestMonth = getBusiestMonth(data);
  const busiestDay = getBusiestDay(data);
  const longestStreak = getLongestDailyStreak(data);

  // console.log(
  //   JSON.stringify(
  //     swaps.map(({ transactions, ...rest }) => ({
  //       ...rest,
  //       transactions: transactions.length,
  //     })),
  //     null,
  //     2,
  //   ),
  // );

  return {
    types,
    swapDesc,
    sources,
    swaps,
    airdrops,
    singleSolTransfersFromMe,
    singleSolTransfersToMe,
    busiestMonth,
    busiestDay,
    longestStreak,
    cliqs,
    userTokens,
    lowestGasFeePaid: lamportsToSol(lowestGasFeePaid),
    highestGasFeePaid: lamportsToSol(highestGasFeePaid),
  };
}
