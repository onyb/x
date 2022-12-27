import type { NextApiRequest, NextApiResponse } from 'next'
import { TokenInfo } from '@uniswap/token-lists'

import Scanner from '~/core/evm/scanner/balances'
import { ChainId } from '~/core/evm/types'

interface TypedNextApiRequest extends NextApiRequest {
  query: {
    chainId: ChainId
    account: string
  }
}

type BalancesResult = {
  token: TokenInfo
  balance: string
}[]

export default async function handler (
  req: TypedNextApiRequest,
  res: NextApiResponse<BalancesResult>
) {
  const { chainId, account } = req.query

  if (!Object.values(ChainId).includes(chainId)) {
    res.status(400).end('Unsupported chainId')
    return
  }

  const balances = await Scanner(chainId, account)

  res.status(200).json(balances)
}
