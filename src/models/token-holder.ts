import { model, Schema, Document } from 'mongoose';

interface ITokenHolder extends Document {
  symbol: string;
  address: string;
  amount: number;
  decimals: number;
  owner: string;
  rank: number;
}

const TokenHolderSchema = new Schema({
  symbol: { type: String, required: true },
  address: { type: String, required: true },
  amount: { type: Number, required: true },
  decimals: { type: Number, required: true },
  owner: { type: String, required: true },
  rank: { type: Number, required: true },
});

const TokenHolderModel = model<ITokenHolder>('TokenHolder', TokenHolderSchema);

export { TokenHolderModel, ITokenHolder };
