import type { NextApiRequest, NextApiResponse } from 'next'

import { TokenInfo } from '@uniswap/token-lists'
import makeBlockie from 'ethereum-blockies-base64'

import Scanner from '~/core/evm/scanner/balances'
import { ChainId } from '~/core/evm/types'
import { getOrResolveAddress } from '~/core/evm/address'
import { getCoingeckoId, getPricingMap } from '~/core/coingecko'
import Amount from '~/core/amount'

interface TypedNextApiRequest extends NextApiRequest {
  query: {
    chainId: ChainId
    account: string
  }
}

type Balance = {
  token: TokenInfo
  amount: string
  amountUSD: string
}

type SuccessResponse = {
  account: string
  resolvedAddress: string
  chainId: string
  blockie: string
  balances: Balance[]
}

type FailureResponse = {
  error: string
}

export default async function handler(
  req: TypedNextApiRequest,
  res: NextApiResponse<SuccessResponse | FailureResponse>,
) {
  const { chainId, account } = req.query

  if (!Object.values(ChainId).includes(chainId)) {
    res.status(400).end('Unsupported chainId')
    return
  }

  try {
    const address = await getOrResolveAddress(account)
    const balances = await Scanner(chainId, address)

    const coingeckoIds = balances
      .map((each) => getCoingeckoId(each.token.address, chainId))
      .filter((each) => Boolean(each))

    const pricingMap = await getPricingMap(coingeckoIds)

    res.status(200).json({
      account,
      chainId,
      resolvedAddress: address,
      blockie: makeBlockie(address.toLowerCase()),
      balances: balances.map((each) => ({
        token: each.token,
        amount: each.balance,
        amountUSD: new Amount(each.balance)
          .times(pricingMap[getCoingeckoId(each.token.address, chainId)] || 0)
          .format(6),
      })),
    })
  } catch (e: unknown) {
    if (e instanceof Error) {
      res.status(400).json({ error: e.message })
    } else {
      res.status(400).json({ error: 'Unknown error' })
    }
  }
}
