import { ethers } from 'ethers'
import { getTokensBalance } from '@mycrypto/eth-scan'

import { ChainId, BalanceScanner } from '~/core/evm/types'

type Config = {
  [key in ChainId]: { rpc: string; scannerContract?: string }
}
const config: Config = {
  [ChainId.POLYGON]: {
    rpc: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGON_API_KEY}`
  },
  [ChainId.ETHEREUM]: {
    rpc: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ETHEREUM_API_KEY}`
  },
  [ChainId.AVALANCHE]: {
    rpc: 'https://api.avax.network/ext/bc/C/rpc'
  },
  [ChainId.BSC]: {
    rpc: 'https://bsc-dataseed.binance.org',
    scannerContract: '0x53242a975aa7c607e17138b0e0231162e3e68593'
  },
  [ChainId.OPTIMISM]: {
    rpc: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_OPTIMISM_API_KEY}`,
    scannerContract: '0x9e5076DF494FC949aBc4461F4E57592B81517D81'
  },
  [ChainId.ARBITRUM]: {
    rpc: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ARBITRUM_API_KEY}`,
    scannerContract: '0xa3e7eb35e779f261ca604138d41d0258e995e97b'
  }
}

export default function scanner (chainId: ChainId): BalanceScanner {
  const providerConfig = config[chainId]
  const provider = new ethers.providers.JsonRpcProvider(providerConfig.rpc)

  return async function * (address: string, contracts: string[]) {
    const nativeBalance = await provider.getBalance(address)
    if (!nativeBalance.isZero()) {
      yield {
        contractAddress: '',
        balance: nativeBalance.toString()
      }
    }

    const result = await getTokensBalance(provider, address, contracts, {
      contractAddress: providerConfig.scannerContract
    })
    const balances = Object.entries(result).filter(([_, balance]) => balance > 0)
    for (const [contract, balance] of balances) {
      yield {
        contractAddress: contract,
        balance: balance.toString()
      }
    }
  }
}
