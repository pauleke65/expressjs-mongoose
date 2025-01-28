export interface TransactionData {
  timestamp: number;
  type: string;
  source: string; // Optional since source may not always be present
  description: string;
  fee: number;
  feePayer: string;
  signature: string;
  tokenTransfers: Array<{
    mint: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
    tokenAmount: number;
    tokenStandard: string;
  }>;
  nativeTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
}

export interface TokenInfo {
  count: number;
  id: string;
  name: string;
  symbol: string;
  destinationToken?: string;
}

export interface SwapInfo {
  icon: string;
  id: string;
  name: string;
  type: string;
  fromTokensCount: TokenInfo[];
  toTokensCount: TokenInfo[];
  transactions: TransactionData[];
}

export interface AirdropInfo extends TransactionData {
  lamportAmount: number;
}

export interface MintPriceAmount {
  id: string;
  amountInUSD: number;
  amount: number;
}

export interface SOLTransfers {
  transfers: Array<TransactionData>;
  totalSol: number;
  highestTransfer: TransactionData;
  fromTokensCount: TokenInfo[];
  toTokensCount: TokenInfo[];
  transfersPerMint: MintPriceAmount[];
}

export interface YearStats {
  label: string;
  value: string;
  icon: string;
}

export interface Stats {
  label: string;
  value: string;
}

export interface StakeData {
  amount: number;
  role: string[];
  status: string;
  type: string;
  voter: string;
  active_stake_amount: number;
  delegated_stake_amount: number;
  sol_balance: number;
  total_reward: string;
  stake_account: string;
  activation_epoch: number;
  stake_type: number;
  deactivationEpoch?: number;
}

export interface StakeInfo {
  icon: string;
  id: string;
  name: string;
  totalAmount: number;
  totalActiveStake: number;
  totalDelegatedStake: number;
  totalRewards: number;
  stakes: StakeData[];
}

export interface NFTInfo {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  amount: number;
  account: string;
  decimals: number;
}

export interface WalletHighlights {
  highestTransfer: number;
  longestStreak: number;
  walletMetrics: YearStats[];
  peakPerformance: YearStats[];
}

export interface Diary {
  actions: {
    type: string;
    percentage: number;
  }[];
  swaps: {
    label: string;
    value: string;
  }[];
}

export interface TokenDataInfo {
  id: string;
  mint: string;
  tokenName: string;
  symbol: string;
  decimals: number;
  description: string;
  logo: string;
  tags: string[];
  verified: string;
  network: string[];
  metadataToken: string;
  price: number | undefined | null;
}

export interface UserData {
  address: string;
  username: string;
  transactionsForYearCount: number;
  protocolTraits: YearStats[];
  yearStats: YearStats[];
  milestones: YearStats[];
  walletHighlights: WalletHighlights;
  nfts: NFTInfo[];
  diary: Diary;
  cliqs: UserCliq[];
  lowestGasFeePaid: number;
  highestGasFeePaid: number;
}

export interface UserTokenInfo {
  account: string;
  address: string;
  amount: number;
  decimals: number;
  name: string;
  symbol: string;
  icon: string;
  price: number;
  amountInUSD: number;
}

export interface UserCliq {
  id: number;
  name: string;
  description: string;
  characteristic: string;
  count: number;
  transactionSignatures: string[];
}
