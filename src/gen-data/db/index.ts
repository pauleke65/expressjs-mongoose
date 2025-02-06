'use server';

import { MONGO_URL } from '../constants';
import { TokenDataInfo, TransactionData, UserTokenInfo } from '../types';
// import * as mongoose from 'mongoose';
import {
  UserTransaction,
  UserNFT,
  UserStakes,
  UserData,
  TokenData,
  UserToken,
} from './models';

// Connect to MongoDB
// async function connectMongo() {
//   if (!mongoose.connections[0].readyState) {
//     await mongoose
//       .connect(MONGO_URL, {
//         autoCreate: true,
//         appName: 'solana-wrapped',
//         dbName: 'solana-wrapped',
//       })
//       .then((fulfilled) => {
//         console.log('connected to mongodb', fulfilled.connection.name);
//       })
//       .catch((error) => {
//         console.error('Connection error:', error);
//       });
//   } else {
//     console.log('Already connected to mongodb');
//   }
// }

import mongoose from 'mongoose';

// if (!process.env.MONGO_URL) {
//   throw new Error('Please add the MONGO_URL environment variable');
// }

mongoose.connect(MONGO_URL);

const database = mongoose.connection;

database.on(
  'error',
  console.error.bind(console, '❌ mongodb connection error'),
);
database.once('open', () => console.log('✅ mongodb connected successfully'));

mongoose.Promise = Promise;

export async function storeUserTransactions(
  userId: string,
  username: string,
  transactions: TransactionData[],
) {
  try {
    // await connectMongo();

    const newUserTransaction = new UserTransaction({
      id: userId,
      username: username,
      transactions: transactions,
    });
    await newUserTransaction.save();

    return true;
  } catch (error) {
    return false;
  }
}

export async function getUserTransactions(userId: string) {
  try {
    // await connectMongo();

    const userTransactions = await UserTransaction.findOne({ id: userId });

    return userTransactions;
  } catch (error) {
    return undefined;
  }
}

export async function storeUserNFTs(userId: string, nfts: any) {
  try {
    // await connectMongo();

    const newUserNFT = new UserNFT({
      id: userId,
      nfts: nfts,
    });
    await newUserNFT.save();

    return true;
  } catch (error) {
    return false;
  }
}

export async function getUserNFTs(userId: string) {
  try {
    // await connectMongo();

    const userNFTs = await UserNFT.findOne({ id: userId });

    return userNFTs;
  } catch (error) {
    return undefined;
  }
}

export async function storeUserStakes(userId: string, stakes: any) {
  try {
    // await connectMongo();

    const newUserStakes = new UserStakes({
      id: userId,
      stakes: stakes,
    });
    await newUserStakes.save();

    return true;
  } catch (error) {
    return false;
  }
}

export async function getUserStakes(userId: string) {
  try {
    // await connectMongo();

    const userStakes = await UserStakes.findOne({ id: userId });

    return userStakes;
  } catch (error) {
    return undefined;
  }
}

export async function storeUserData(userData: any) {
  try {
    // await connectMongo();

    const newUserData = new UserData({ id: userData.address, ...userData });
    await newUserData.save();

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function getUserData(userId: string) {
  try {
    // await connectMongo();

    const userData = await UserData.findOne({ id: userId });

    return {
      address: userData.address,
      username: userData.username,
      protocolTraits: userData.protocolTraits,
      yearStats: userData.yearStats,
      milestones: userData.milestones,
      walletHighlights: userData.walletHighlights,
      nfts: userData.nfts,
      diary: userData.diary,
      cliqs: userData.cliqs,
      userTokens: userData.userTokens,
      transactionsForYearCount: userData.transactionsForYearCount,
      lowestGasFeePaid: userData.lowestGasFeePaid ?? 0,
      highestGasFeePaid: userData.highestGasFeePaid ?? 0,
    };
  } catch (error) {
    return undefined;
  }
}

export async function getAllUserData() {
  try {
    // await connectMongo();

    const data = await UserData.find({}).sort({ createdAt: -1 });

    const allData = data.reduce((acc: { [x: string]: any }, item: any) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<string, any>);

    return allData;
  } catch (error) {
    return undefined;
  }
}

export async function storeTokenData(tokens: TokenDataInfo[]) {
  try {
    // await connectMongo();

    const newTokens = tokens.map((token) => ({
      id: token.id,
      mint: token.mint,
      tokenName: token.tokenName,
      symbol: token.symbol,
      decimals: token.decimals,
      description: token.description,
      logo: token.logo,
      tags: token.tags,
      verified: token.verified,
      network: token.network,
      metadataToken: token.metadataToken,
      price: token.price,
    }));

    await TokenData.insertMany(newTokens);

    return true;
  } catch (error) {
    return false;
  }
}

export async function getTokenDatas(tokenIds: string[]) {
  try {
    // await connectMongo();

    const tokens = await TokenData.find({ id: { $in: tokenIds } });

    return tokens.map((token) => ({
      id: token.id,
      mint: token.mint,
      tokenName: token.tokenName,
      symbol: token.symbol,
      decimals: token.decimals,
      description: token.description,
      logo: token.logo,
      tags: token.tags,
      verified: token.verified,
      network: token.network,
      metadataToken: token.metadataToken,
      price: token.price,
    }));
  } catch (error) {
    return undefined;
  }
}

export async function storeUserTokens(userId: string, tokens: UserTokenInfo[]) {
  try {
    // await connectMongo();

    const newUserTokens = new UserToken({ id: userId, tokens: tokens });
    await newUserTokens.save();

    return true;
  } catch (error) {
    return false;
  }
}

export async function getUserTokensDB(userId: string) {
  try {
    // await connectMongo();

    const userTokens = await UserToken.findOne({ id: userId });

    return userTokens;
  } catch (error) {
    return undefined;
  }
}
