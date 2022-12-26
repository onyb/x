import type { NextApiRequest, NextApiResponse } from 'next'
import { TokenInfo } from '@uniswap/token-lists'

import EVMScanner from '~/core/evm/scanner/balances/EVMScanner'
import AlchemyScanner from '~/core/evm/scanner/balances/AlchemyScanner'
import { BalanceScanner, ChainId } from '~/core/evm/types'
import UniswapLabsDefaultList from '~/data/tokenlists/uniswap-default.json'
import PancakeSwapExtendedList from '~/data/tokenlists/pancakeswap-extended.json'
import AvalancheList from '~/data/tokenlists/avalanche.json'

type Config = {
  [key in ChainId]: {
    scanner: BalanceScanner
    tokens: TokenInfo[]
    ignoreContracts?: string[]
  }
}
const config: Config = {
  [ChainId.ETHEREUM]: {
    scanner: AlchemyScanner(ChainId.ETHEREUM),
    tokens: UniswapLabsDefaultList.tokens.filter(
      token => `0x${token.chainId.toString(16)}` === ChainId.ETHEREUM
    )
  },
  [ChainId.POLYGON]: {
    scanner: AlchemyScanner(ChainId.POLYGON),
    tokens: UniswapLabsDefaultList.tokens.filter(
      token => `0x${token.chainId.toString(16)}` === ChainId.POLYGON
    ),
    ignoreContracts: [
      // Genesis contract used for bridging to/from Polygon. It implements a
      // balanceOf() method that acts as a proxy for querying the native
      // MATIC balance.
      //
      // We ignore this so it doesn't result in duplicate balance entries.
      '0x0000000000000000000000000000000000001010'
    ]
  },
  [ChainId.BSC]: {
    scanner: EVMScanner(ChainId.BSC),
    tokens: PancakeSwapExtendedList.tokens.filter(
      token => `0x${token.chainId.toString(16)}` === ChainId.BSC
    )
  },
  [ChainId.AVALANCHE]: {
    scanner: EVMScanner(ChainId.AVALANCHE),
    tokens: AvalancheList.tokens.filter(
      token => `0x${token.chainId.toString(16)}` === ChainId.AVALANCHE
    )
  },
  [ChainId.OPTIMISM]: {
    scanner: AlchemyScanner(ChainId.OPTIMISM),
    tokens: UniswapLabsDefaultList.tokens.filter(
      token => `0x${token.chainId.toString(16)}` === ChainId.OPTIMISM
    )
  },
  [ChainId.ARBITRUM]: {
    scanner: AlchemyScanner(ChainId.ARBITRUM),
    tokens: UniswapLabsDefaultList.tokens.filter(
      token => `0x${token.chainId.toString(16)}` === ChainId.ARBITRUM
    )
  }
}

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

  const { scanner, tokens, ignoreContracts } = config[chainId]
  const balances = await scanner(
    account,
    tokens.map(token => token.address).filter(address => !(ignoreContracts || []).includes(address))
  )

  const result = tokens
    .filter(token => balances[token.address])
    .map(token => ({
      token,
      balance: balances[token.address]
    }))

  res.status(200).json(result)
}
