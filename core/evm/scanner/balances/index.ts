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

export default async function scanner (chainId: ChainId, account: string) {
  const { scanner, tokens, ignoreContracts } = config[chainId]
  const balancesMap = await scanner(
    account,
    tokens.map(token => token.address).filter(address => !(ignoreContracts || []).includes(address))
  )

  const tokenBalances = tokens
    .filter(token => balancesMap[token.address])
    .map(token => ({
      token,
      balance: ethers.utils.formatUnits(balancesMap[token.address], token.decimals)
    }))

  const nativeBalances = balancesMap['']
    ? [
      {
        token: makeDummyNativeTokenInfo(chainId),
        balance: ethers.utils.formatEther(balancesMap[''])
      }
    ]
    : []

  return nativeBalances.concat(...tokenBalances)
}
