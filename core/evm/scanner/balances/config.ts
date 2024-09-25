import { TokenInfo } from '@uniswap/token-lists'

import { BalanceScanner, ChainId } from '~/core/evm/types'
import EVMScanner from '~/core/evm/scanner/balances/EVMScanner'

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
  [ChainId.Ethereum]: {
    scanner: EVMScanner(ChainId.Ethereum),
    tokens: UniswapLabsDefaultList.tokens.filter(
      (token) => `0x${token.chainId.toString(16)}` === ChainId.Ethereum,
    ),
  },
  [ChainId.Polygon]: {
    scanner: EVMScanner(ChainId.Polygon),
    tokens: UniswapLabsDefaultList.tokens.filter(
      (token) => `0x${token.chainId.toString(16)}` === ChainId.Polygon,
    ),
    ignoreContracts: [
      // Genesis contract used for bridging to/from Polygon. It implements a
      // balanceOf() method that acts as a proxy for querying the native
      // MATIC balance.
      //
      // We ignore this so it doesn't result in duplicate balance entries.
      '0x0000000000000000000000000000000000001010',
    ],
  },
  [ChainId.BnbSmartChain]: {
    scanner: EVMScanner(ChainId.BnbSmartChain),
    tokens: PancakeSwapExtendedList.tokens.filter(
      (token) => `0x${token.chainId.toString(16)}` === ChainId.BnbSmartChain,
    ),
  },
  [ChainId.Base]: {
    scanner: EVMScanner(ChainId.Base),
    tokens: AvalancheList.tokens.filter(
      (token) => `0x${token.chainId.toString(16)}` === ChainId.Base,
    ),
  },
  [ChainId.Optimism]: {
    scanner: EVMScanner(ChainId.Optimism),
    tokens: UniswapLabsDefaultList.tokens.filter(
      (token) => `0x${token.chainId.toString(16)}` === ChainId.Optimism,
    ),
  },
  [ChainId.Arbitrum]: {
    scanner: EVMScanner(ChainId.Arbitrum),
    tokens: UniswapLabsDefaultList.tokens.filter(
      (token) => `0x${token.chainId.toString(16)}` === ChainId.Arbitrum,
    ),
  },
}

export default config
