import type { NextApiRequest, NextApiResponse } from 'next'

import makeBlockie from 'ethereum-blockies-base64'

import Scanner from '~/core/evm/scanner/balances'
import { ChainId, TokenInfo } from '~/core/evm/types'
import { getOrResolveAddress, getAddressExplorerUrl } from "~/core/evm/address";
import { getCoingeckoId } from "~/core/coingecko";
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
  explorer: string
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

    res.status(200).json({
      account,
      chainId,
      resolvedAddress: address,
      explorer: getAddressExplorerUrl(address, chainId),
      blockie: makeBlockie(address.toLowerCase()),
      balances: balances.map((each) => ({
        token: each.token,
        amount: each.balance,
        amountUSD: new Amount(each.balance)
          .times(each.token.price)
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
