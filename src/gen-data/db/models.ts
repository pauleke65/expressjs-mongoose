import { Schema, model, Document, models } from 'mongoose';

export interface IUserTransaction extends Document {
  id: string;
  username: string;
  transactions: any;
}

const UserTransactionSchema: Schema<IUserTransaction> = new Schema(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    transactions: { type: [Schema.Types.Mixed], required: true },
  },
  { timestamps: true },
);

export interface IUserNFT extends Document {
  id: string;
  nfts: any;
}

const UserNFTSchema: Schema<IUserNFT> = new Schema(
  {
    id: { type: String, required: true, unique: true },
    nfts: { type: [Schema.Types.Mixed], required: true },
  },
  { timestamps: true },
);

export interface IUserStakes extends Document {
  id: string;
  stakes: any;
}

const UserStakesSchema: Schema<IUserStakes> = new Schema(
  {
    id: { type: String, required: true, unique: true },
    stakes: { type: [Schema.Types.Mixed], required: true },
  },
  { timestamps: true },
);

export interface IUserData extends Document {
  id: string;
  address: string;
  username: string;
  transactionsForYearCount: number;
  protocolTraits: any;
  yearStats: any;
  milestones: any;
  walletHighlights: any;
  nfts: any;
  diary: any;
  cliqs: any;
  userTokens: any;
  lowestGasFeePaid: number;
  highestGasFeePaid: number;
}

const UserDataSchema: Schema<IUserData> = new Schema(
  {
    id: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    username: { type: String, required: true },
    transactionsForYearCount: { type: Number, required: true },
    protocolTraits: { type: [Schema.Types.Mixed], required: true },
    yearStats: { type: [Schema.Types.Mixed], required: true },
    milestones: { type: [Schema.Types.Mixed], required: true },
    walletHighlights: { type: Schema.Types.Mixed, required: true },
    nfts: { type: [Schema.Types.Mixed], required: true },
    diary: { type: Schema.Types.Mixed, required: true },
    cliqs: { type: [Schema.Types.Mixed], required: true },
    userTokens: { type: [Schema.Types.Mixed], required: true },
    lowestGasFeePaid: { type: Number, required: true },
    highestGasFeePaid: { type: Number, required: true },
  },

  { timestamps: true },
);

export interface ITokenData extends Document {
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
  price: number;
}

const TokenDataSchema: Schema<ITokenData> = new Schema(
  {
    id: { type: String, required: true, unique: true },
    mint: { type: String, required: true },
    tokenName: { type: String, required: true },
    symbol: { type: String, required: true },
    decimals: { type: Number, required: true },
    description: { type: String, required: true },
    logo: { type: String, required: true },
    tags: { type: [String], required: true },
    verified: { type: String, required: true },
    network: { type: [String], required: true },
    metadataToken: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true },
);

export interface IUserToken extends Document {
  id: string;
  tokens: any;
}

const UserTokenInfoSchema: Schema<IUserToken> = new Schema(
  {
    id: { type: String, required: true, unique: true },
    tokens: { type: [Schema.Types.Mixed], required: true },
  },
  { timestamps: true },
);
// Create and export the User model
const UserTransaction =
  models.UserTransaction ||
  model<IUserTransaction>('UserTransaction', UserTransactionSchema);
const UserNFT = models.UserNFT || model<IUserNFT>('UserNFT', UserNFTSchema);
const UserStakes =
  models.UserStakes || model<IUserStakes>('UserStakes', UserStakesSchema);
const UserData =
  models.UserData || model<IUserData>('UserData', UserDataSchema);
const TokenData =
  models.TokenData || model<ITokenData>('TokenData', TokenDataSchema);
const UserToken =
  models.UserToken || model<IUserToken>('UserToken', UserTokenInfoSchema);

export { UserTransaction, UserNFT, UserStakes, UserData, TokenData, UserToken };
