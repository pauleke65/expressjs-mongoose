'use server';
import { getUserStakes, storeUserStakes } from './db';
import { SOLCAN_API_TOKEN } from './constants';
import { StakeInfo } from './types';

export async function getStakes(address: string): Promise<StakeInfo[]> {
  const res = await getUserStakes(address);
  if (res) {
    return res.stakes;
  }

  const requestOptions = {
    method: 'get',
    headers: { token: SOLCAN_API_TOKEN },
  };
  const response = await fetch(
    `https://pro-api.solscan.io/v2.0/account/token-accounts?address=${address}&type=nft&page=1&page_size=10`,
    requestOptions,
  );

  const data = await response.json();

  const stakes: StakeInfo[] = [];

  (data.data ?? []).forEach((item: any) => {
    if (item.status === 'active') {
      const stake = stakes.find((s) => s.id === item.voter);
      if (!stake) {
        stakes.push({
          icon: '',
          id: item.voter,
          name: 'name',
          totalAmount: item.amount,
          totalActiveStake: item.active_stake_amount,
          totalDelegatedStake: item.delegated_stake_amount,
          totalRewards: isNaN(parseInt(item.total_reward))
            ? 0
            : parseInt(item.total_reward),
          stakes: [item],
        });
      }
    }
  });

  stakes.sort((a, b) => b.totalAmount - a.totalAmount);

  await storeUserStakes(address, stakes);

  return stakes;
}
