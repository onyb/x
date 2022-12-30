import { ethers } from 'ethers'
import { TokenInfo } from '@uniswap/token-lists'

import config from './config'
import { ChainId } from '~/core/evm/types'

function makeDummyNativeTokenInfo (chainId: ChainId): TokenInfo {
  return {
    chainId: parseInt(chainId),
    address: '',
    name: '',
    decimals: 0,
    symbol: chainIdToSymbolMap[chainId] || ''
  }
}

const chainIdToSymbolMap = {
  [ChainId.ETHEREUM]: 'ETH',
  [ChainId.POLYGON]: 'MATIC',
  [ChainId.BSC]: 'BNB',
  [ChainId.AVALANCHE]: 'AVAX',
  [ChainId.OPTIMISM]: 'ETH',
  [ChainId.ARBITRUM]: 'ETH'
}

export default async function scanner (chainId: ChainId, address: string) {
  const { scanner, tokens, ignoreContracts } = config[chainId]
  const stream = scanner(
    address,
    tokens.map(token => token.address).filter(address => !(ignoreContracts || []).includes(address))
  )

  // TODO: move this to config, in order to avoid generation of this map on every scan.
  const contractTokenInfoMap: Record<string, TokenInfo> = tokens.reduce(
    (a, v) => ({ ...a, [v.address]: v }),
    {}
  )

  // Consume the stream
  // TODO: is it possible to render this stream asynchronously?
  const balances = []
  for await (const item of stream) {
    balances.push(item)
  }

  return balances.map(({ balance, contractAddress }) => {
    if (contractAddress) {
      const token = contractTokenInfoMap[contractAddress]

      return {
        balance: ethers.utils.formatUnits(balance, token.decimals),
        token
      }
    }

    return {
      token: makeDummyNativeTokenInfo(chainId),
      balance: ethers.utils.formatEther(balance)
    }
  })
}
