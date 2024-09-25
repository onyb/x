import { mapLimit } from 'async'

import tokenLists from '~/data/coingecko-ids.json'
import { ChainId } from '../evm/types'

type TokenList = {
  [chainId: string]: {
    [contractOrProgramAddress: string]: {
      id: string
      decimals: number
    }
  }
}

type PriceResponse = {
  payload: {
    [key: string]: {
      usd: number
    }
  }
}

const maxBatchSizePrice = 25
const maxConcurrentPriceRequests = 2

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

  return ((tokenLists as unknown as TokenList)[chainId] || {})[
    contractOrProgramAddress.toLowerCase()
  ]?.id
}

export async function getPricingMap(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids))
  const chunkedParams = []
  for (let i = 0; i < uniqueIds.length; i += maxBatchSizePrice) {
    chunkedParams.push(uniqueIds.slice(i, i + maxBatchSizePrice))
  }

  // Use maxConcurrentPriceRequests concurrent HTTP requests to
  // fetch prices, in batch of maxBatchSizePrice.
  const results = await mapLimit(
    chunkedParams,
    maxConcurrentPriceRequests,
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
        maxConcurrentPriceRequests,
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
