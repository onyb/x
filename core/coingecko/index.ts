import { mapLimit } from 'async'

import tokenLists from '~/data/coingecko-ids.json'
import { ChainId, TokensList } from '../evm/types'

type PriceResponse = {
  payload: {
    [key: string]: {
      usd: number
    }
  }
}

type CoingeckoTokenInfo = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number
};

const maxRatiosBatchSizePrice = 25
const maxRatiosConcurrentPriceRequests = 4
const maxCoingeckoBatchSizePrice = 250
const maxCoingeckoConcurrentPriceRequests = 4


const nativeAssetCoingeckoIdMapping: { [key in ChainId]: string } = {
  [ChainId.Ethereum]: 'ethereum',
  [ChainId.Polygon]: 'matic-network',
  [ChainId.BnbSmartChain]: 'binancecoin',
  [ChainId.Optimism]: 'ethereum',
  [ChainId.Arbitrum]: 'ethereum',
  [ChainId.Base]: 'ethereum',
}

export const getCoingeckoId = (
  contractOrProgramAddress: string,
  chainId: ChainId,
) => {
  if (contractOrProgramAddress === '') {
    return nativeAssetCoingeckoIdMapping[chainId]
  }

  return ((tokenLists as unknown as TokensList)[chainId] || {})[
    contractOrProgramAddress.toLowerCase()
  ]?.id;
}

export const getTokenDecimals = (
  contractOrProgramAddress: string,
  chainId: ChainId,
) => {
  return ((tokenLists as unknown as TokensList)[chainId] || {})[
    contractOrProgramAddress.toLowerCase()
  ]?.decimals;
}

export async function getPricingMap(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids))
  const chunkedParams = []
  for (let i = 0; i < uniqueIds.length; i += maxRatiosBatchSizePrice) {
    chunkedParams.push(uniqueIds.slice(i, i + maxRatiosBatchSizePrice))
  }

  // Use maxRatiosConcurrentPriceRequests concurrent HTTP requests to
  // fetch prices, in batch of maxBatchSizePrice.
  const results = await mapLimit(
    chunkedParams,
    maxRatiosConcurrentPriceRequests,
    async function (params: string[]) {
      const result = await fetch(
        `https://ratios.rewards.brave.com/v2/relative/provider/coingecko/${params.join(',')}/usd/1d`,
      )

      if (result.ok) {
        const prices: PriceResponse = await result.json()
        return Object.fromEntries(
          Object.entries(prices.payload).map(([key, value]) => [
            key,
            value.usd,
          ]),
        )
      }

      console.log('Unable to fetch prices for batch:', params)
      const fallbackResults = await mapLimit(
        params,
        maxRatiosConcurrentPriceRequests,
        async function (param: string) {
          const result = await fetch(
            `https://ratios.rewards.brave.com/v2/relative/provider/coingecko/${param}/usd/1d`,
          )

          if (result.ok) {
            const price: PriceResponse = await result.json()
            return Object.fromEntries(
              Object.entries(price.payload).map(([key, value]) => [
                key,
                value.usd,
              ]),
            )
          }

          console.log('Unable to fetch price using fallback:', param)

          return []
        },
      )

      return fallbackResults.flat()
    },
  )

  return results
    .flat()
    .reduce((acc, priceMap) => Object.assign(acc, priceMap), {})
}

export async function getTokenInfos(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));

  const chunkedParams = []
  for (let i = 0; i < uniqueIds.length; i += maxCoingeckoBatchSizePrice) {
    chunkedParams.push(uniqueIds.slice(i, i + maxCoingeckoBatchSizePrice));
  }

  const concurrency =
    uniqueIds.length <= maxCoingeckoBatchSizePrice ? 1 : chunkedParams.length;

  const start = Date.now();
  const results = await mapLimit(
    chunkedParams,
    concurrency,
    async function (params: string[]) {
      const response = await fetch(
        `https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${params.join(
          "%2C"
        )}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            "x-cg-pro-api-key": process.env.COINGECKO_API_KEY || "",
          },
        }
      );

      const result: CoingeckoTokenInfo[] = await response.json();
      return result.map((e) => ({
        id: e.id,
        symbol: e.symbol,
        name: e.name,
        logo: e.image,
        price: e.current_price,
      }));
    }
  );

  console.log(
    `getTokenInfos() ids=${
      uniqueIds.length
    } concurrency=${concurrency} [${Date.now() - start}ms]`
  );
  
  return results.flat()
}
