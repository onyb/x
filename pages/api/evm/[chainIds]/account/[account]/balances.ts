import type { NextApiRequest, NextApiResponse } from 'next'

import BalanceScanner from '@core/evm/scan/balances/BalanceScanner'
import AlchemyScanner from '@core/evm/scan/balances/AlchemyScanner'

import UniswapLabsDefaultList from '@data/tokenlists/uniswap-default.json'
import PancakeSwapExtendedList from '@data/tokenlists/pancakeswap-extended.json'
import { ChainId } from '@core/evm/constants'

const config = {
  [ChainId.ETHEREUM]: {
    runner: AlchemyScanner(ChainId.ETHEREUM),
    tokens: UniswapLabsDefaultList.tokens.filter(
      token => `0x${token.chainId.toString(16)}` === ChainId.ETHEREUM
    )
  },
  [ChainId.POLYGON]: {
    runner: AlchemyScanner(ChainId.POLYGON),
    tokens: UniswapLabsDefaultList.tokens.filter(
      token => `0x${token.chainId.toString(16)}` === ChainId.POLYGON
    )
  },
  [ChainId.BSC]: {
    runner: BalanceScanner(ChainId.BSC),
    tokens: PancakeSwapExtendedList.tokens.filter(
      token => `0x${token.chainId.toString(16)}` === ChainId.BSC
    )
  }
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  const { chainIds: chainIdsRaw, account: accountRaw } = req.query
  const account = accountRaw as string
  const chainIds = (chainIdsRaw as string).toLowerCase().split(',')

  const result = await Promise.all(
    chainIds.map(async chainIdStr => {
      const chainId: ChainId = <ChainId>chainIdStr
      const { runner, tokens } = config[chainId]
      return await runner(
        account,
        tokens.map(e => e.address)
      )
    })
  )

  res.status(200).json(
    Object.fromEntries(
      chainIds.map(function (chainId, idx) {
        return [chainId, result[idx]]
      })
    )
  )
}
