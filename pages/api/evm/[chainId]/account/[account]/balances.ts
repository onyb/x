import type { NextApiRequest, NextApiResponse } from 'next'
import { TokenInfo } from '@uniswap/token-lists'

import Scanner from '~/core/evm/scanner/balances'
import { ChainId } from '~/core/evm/types'
import { getOrResolveAddress } from '~/core/evm/address'

interface TypedNextApiRequest extends NextApiRequest {
  query: {
    chainId: ChainId
    account: string
  }
}

type SuccessResponse = {
  token: TokenInfo
  balance: string
}[]

type FailureResponse = {
  error: string
}

export default async function handler (
  req: TypedNextApiRequest,
  res: NextApiResponse<SuccessResponse | FailureResponse>
) {
  const { chainId, account } = req.query

  if (!Object.values(ChainId).includes(chainId)) {
    res.status(400).end('Unsupported chainId')
    return
  }

  try {
    const address = await getOrResolveAddress(account)
    const balances = await Scanner(chainId, address)
    res.status(200).json(balances)
  } catch (e: unknown) {
    if (e instanceof Error) {
      res.status(400).json({ error: e.message })
    } else {
      res.status(400).json({ error: 'Unknown error' })
    }
  }
}
