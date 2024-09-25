import { TokenInfo } from '@uniswap/token-lists'

import { BalanceScanner, ChainId } from '~/core/evm/types'
import EVMScanner from '~/core/evm/scanner/balances/EVMScanner'

type Config = {
  [key in ChainId]: {
    scanner: BalanceScanner
    ignoreContracts?: string[]
  }
}

const config: Config = {
  [ChainId.Ethereum]: {
    scanner: EVMScanner(ChainId.Ethereum),
  },
  [ChainId.Polygon]: {
    scanner: EVMScanner(ChainId.Polygon),
    ignoreContracts: [
      // Genesis contract used for bridging to/from Polygon. It implements a
      // balanceOf() method that acts as a proxy for querying the native
      // MATIC balance.
      //
      // We ignore this so it doesn't result in duplicate balance entries.
      "0x0000000000000000000000000000000000001010",
    ],
  },
  [ChainId.BnbSmartChain]: {
    scanner: EVMScanner(ChainId.BnbSmartChain),
  },
  [ChainId.Base]: {
    scanner: EVMScanner(ChainId.Base),
  },
  [ChainId.Optimism]: {
    scanner: EVMScanner(ChainId.Optimism),
  },
  [ChainId.Arbitrum]: {
    scanner: EVMScanner(ChainId.Arbitrum),
  },
};

export default config
