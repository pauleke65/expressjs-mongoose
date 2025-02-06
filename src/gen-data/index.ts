'use server';

import { getUserData, storeUserData } from './db';
import { getNFTs } from './get-nfts';
import { getStakes } from './get-stakes';
import { getTokens, getUserTokens } from './get-tokens';
import { getTraits } from './get-traits';
import { getTransactionsForYear } from './get-transactions-year';
import { getDateFromTimestamp, lamportsToSol } from './sol-utils';
import {
  SwapInfo,
  TransactionData,
  StakeInfo,
  YearStats,
  UserTokenInfo,
} from './types';

const calculatePercentages = (data: SwapInfo[]) => {
  const totalTransactions = data.reduce(
    (sum, item) => sum + item.transactions.length,
    0,
  );

  const percentagesByType = data.reduce((acc, { type, transactions }) => {
    acc[type] = (acc[type] || 0) + transactions.length;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(percentagesByType)
    .map(([type, count]) => ({
      type,
      percentage: Math.round((count / totalTransactions) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);
};

const getMilestones = (
  transactions: TransactionData[],
  stakes: StakeInfo[],
  uniqueInteractions: Set<string>,
) => {
  const milestones: YearStats[] = [
    {
      label: 'First Transaction Milestone',
      icon: '',
      value: getDateFromTimestamp(
        transactions[transactions.length - 1].timestamp,
      ),
    },
    {
      label: 'Unique Wallet Interactions',
      icon: '',
      value: `Interacted with ${uniqueInteractions.size} unique wallets`,
    },
    {
      label: 'Biggest Stake Achievement',
      icon: '',
      value: `${lamportsToSol(
        stakes[0]?.totalAmount ?? 0,
      ).toLocaleString()} SOL`,
    },
  ];

  return milestones;
};

const getUserClassAndDescription = (
  sentTransfers: number,
  receivedTransfers: number,
) => {
  if (sentTransfers > receivedTransfers) {
    return {
      userClass: 'Sunshower',
      description:
        'You have sent more transfers than you have received, spreading your wealth like sunshine.',
    };
  } else if (receivedTransfers > sentTransfers) {
    return {
      userClass: 'Mooncatcher',
      description:
        'You have received more transfers than you have sent, gathering wealth like moonlight.',
    };
  } else {
    return {
      userClass: 'Starweaver',
      description:
        'You have balanced sending and receiving transfers, weaving a network of connections like starlight.',
    };
  }
};

export const generateData = async (address: string) => {
  const { username, transactions: transactionsForYear } =
    await getTransactionsForYear(address);

  if (!transactionsForYear || transactionsForYear.length === 0) {
    return null;
  }

  const traits = await getTraits(address, transactionsForYear);

  const ignoreProtocols = [
    'SYSTEM_PROGRAM',
    'UNKNOWN',
    'STAKE_PROGRAM',
    'SOLANA_PROGRAM_LIBRARY',
    'BPF_LOADER',
    'BPF_UPGRADEABLE_LOADER',
    'FORM_FUNCTION',
  ];

  const protocolTraits: YearStats[] = [];
  const protocolsMap = new Map<string, YearStats>(); // Map for quick lookups

  const protocols = traits.swaps.filter(
    (swap) => !ignoreProtocols.includes(swap.id),
  );

  protocols.forEach((swap) => {
    const existingProtocol = protocolsMap.get(swap.id);
    if (existingProtocol) {
      // Update the value (transactions count)
      existingProtocol.value = (
        parseInt(existingProtocol.value) + swap.transactions.length
      ).toString();
    } else {
      // Add new protocol entry
      const newProtocol = {
        label: swap.id,
        value: swap.transactions.length.toString(),
        icon: swap.icon,
      };
      protocolsMap.set(swap.id, newProtocol);
    }
  });

  // Convert the Map back to an array
  protocolTraits.push(...protocolsMap.values());

  protocolTraits.sort((a, b) => parseInt(b.value) - parseInt(a.value));

  const lamportsReceived = traits.singleSolTransfersFromMe?.totalSol || 0;
  const lamportsSent = traits.singleSolTransfersToMe?.totalSol || 0;
  const airdropsReceived = traits.airdrops.reduce(
    (sum, airdrop) => sum + airdrop.lamportAmount,
    0,
  );
  const totalLamports = lamportsReceived + lamportsSent + airdropsReceived;

  const stakes = await getStakes(address);

  const yearStats = [
    {
      label: 'Total Volume',
      value: `${lamportsToSol(totalLamports)} SOL`,
      icon: '/volume-icon.png',
    },
    {
      label: 'Transfers Out',
      value: `${lamportsToSol(lamportsSent)} SOL`,
      icon: '/transfer-icon.png',
    },
    {
      label: 'Transfers In',
      value: `${lamportsToSol(lamportsReceived)} SOL`,
      icon: '/transfer-icon.png',
    },
    {
      label: 'Airdrops',
      value: `${lamportsToSol(airdropsReceived)} SOL`,
      icon: '/airdrop-icon.png',
    },
    {
      label: 'Staking Rewards',
      value: `${lamportsToSol(
        stakes.reduce((sum, stake) => sum + stake.totalRewards, 0),
      )} SOL`,
      icon: '/stake-icon.png',
    },
  ];

  const nfts = await getNFTs(address);

  const uniqueInteractions = new Set<string>();
  traits.singleSolTransfersToMe?.transfers.forEach(
    (transfer) =>
      transfer.nativeTransfers.length > 0 &&
      uniqueInteractions.add(
        transfer.nativeTransfers.length > 0
          ? transfer.nativeTransfers[0].fromUserAccount
          : transfer.tokenTransfers[0].fromUserAccount,
      ),
  );
  traits.singleSolTransfersFromMe?.transfers.forEach((transfer) =>
    uniqueInteractions.add(
      transfer.nativeTransfers.length > 0
        ? transfer.nativeTransfers[0].toUserAccount
        : transfer.tokenTransfers[0].toUserAccount,
    ),
  );
  transactionsForYear.forEach((transaction) => {
    if (transaction.feePayer !== address) {
      uniqueInteractions.add(transaction.feePayer);
    }
  });

  const milestones = getMilestones(
    transactionsForYear,
    stakes,
    uniqueInteractions,
  );
  const { userClass, description } = getUserClassAndDescription(
    traits.singleSolTransfersFromMe?.transfers.length || 0,
    traits.singleSolTransfersToMe?.transfers.length || 0,
  );

  milestones.push({
    label: `You're a ${userClass}`,
    icon: '',
    value: description,
  });
  const highestTransferToMe =
    (traits.singleSolTransfersToMe?.highestTransfer?.nativeTransfers.length ??
      0) > 0
      ? traits.singleSolTransfersToMe?.highestTransfer.nativeTransfers[0]
          .amount || 0
      : 0;

  const highestTransferFromMe =
    (traits.singleSolTransfersFromMe?.highestTransfer?.nativeTransfers.length ??
      0) > 0
      ? traits.singleSolTransfersFromMe?.highestTransfer.nativeTransfers[0]
          .amount || 0
      : traits.singleSolTransfersFromMe?.highestTransfer.tokenTransfers[0]
          .tokenAmount || 0;
  const highestTransfer = lamportsToSol(
    Math.max(highestTransferToMe, highestTransferFromMe),
  );

  const walletHighlights = {
    highestTransfer,
    longestStreak: traits.longestStreak.length,
    walletMetrics: [
      {
        label: 'Gas Fees Paid',
        value: lamportsToSol(
          transactionsForYear
            .filter((transaction) => transaction.feePayer === address)
            .reduce((acc, curr) => acc + curr.fee, 0),
        ).toString(),
        icon: '',
      },
      {
        label: 'Unique Connections',
        value: uniqueInteractions.size.toString(),
        icon: '',
      },
    ],
    peakPerformance: [
      {
        label: 'Busiest Day',
        value: `${traits.busiestDay.date} (${traits.busiestDay.count} transactions)`,
        icon: '',
      },
      {
        label: 'Busiest Month',
        value: `${traits.busiestMonth.month} (${traits.busiestMonth.count} transactions)`,
        icon: '',
      },
    ],
  };

  const swapItems = traits.swaps.filter((swap) => swap.type === 'SWAP');

  const allTokens = new Set<string>();

  swapItems.forEach((swapItem) => {
    swapItem.fromTokensCount.forEach((token) => allTokens.add(token.id));
    swapItem.toTokensCount.forEach((token) => allTokens.add(token.id));
  });

  let mostSwappedToToken: string | undefined;
  let mostSwappedFromToken: string | undefined;
  let maxSwappedToCount = 0;
  let maxSwappedFromCount = 0;

  swapItems.forEach((swapItem) => {
    if (swapItem.fromTokensCount.length > 0) {
      const mostSwapped = swapItem.fromTokensCount.reduce((prev, curr) =>
        prev.count > curr.count ? prev : curr,
      );

      if (mostSwapped.count > maxSwappedFromCount) {
        maxSwappedFromCount = mostSwapped.count;
        mostSwappedFromToken = mostSwapped.id;
      }
    }

    if (swapItem.toTokensCount.length > 0) {
      const mostSwapped = swapItem.toTokensCount.reduce((prev, curr) =>
        prev.count > curr.count ? prev : curr,
      );

      if (mostSwapped.count > maxSwappedToCount) {
        maxSwappedToCount = mostSwapped.count;
        mostSwappedToToken = mostSwapped.id;
      }
    }
  });

  const userTokens = traits.userTokens;

  const tokenData: Record<string, UserTokenInfo> = {};
  for (const token of userTokens) {
    tokenData[token.account] = {
      account: token.account,
      address: token.address,
      amount: token.amount,
      decimals: token.decimals,
      name: token.name,
      symbol: token.symbol,
      icon: token.icon,
      price: token.price,
      amountInUSD: token.amountInUSD,
    };
  }

  mostSwappedFromToken =
    mostSwappedFromToken && tokenData[mostSwappedFromToken]
      ? tokenData[mostSwappedFromToken].symbol
      : undefined;
  mostSwappedToToken =
    mostSwappedToToken && tokenData[mostSwappedToToken]
      ? tokenData[mostSwappedToToken].symbol
      : undefined;

  const swaps = [];

  if (mostSwappedFromToken) {
    swaps.push({
      label: 'Most Swapped From',
      value: `${mostSwappedFromToken} (${maxSwappedFromCount} times)`,
    });
  }

  if (mostSwappedToToken) {
    swaps.push({
      label: 'Most Swapped To',
      value: `${mostSwappedToToken} (${maxSwappedToCount} times)`,
    });
  }
  const diary = {
    actions: calculatePercentages(traits.swaps).filter(
      (action) => action.type !== 'UNKNOWN',
    ),
    swaps,
  };

  const cliqs = traits.cliqs;

  const res = {
    address,
    username,
    protocolTraits,
    yearStats,
    milestones,
    walletHighlights,
    nfts,
    diary,
    cliqs,
    userTokens,
    transactionsForYearCount: transactionsForYear.length,
    lowestGasFeePaid: traits.lowestGasFeePaid,
    highestGasFeePaid: traits.highestGasFeePaid,
  };

  await storeUserData(res);

  return res;
};
