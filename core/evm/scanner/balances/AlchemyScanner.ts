import { Alchemy, Network } from 'alchemy-sdk'
import { ethers } from 'ethers'

import { BalanceScanner, ChainId } from '~/core/evm/types'

const chainIdAlchemyAPIKeyMap: { [key in ChainId]?: string } = {
  [ChainId.ETHEREUM]: process.env.ALCHEMY_ETHEREUM_API_KEY,
  [ChainId.POLYGON]: process.env.ALCHEMY_POLYGON_API_KEY,
  [ChainId.OPTIMISM]: process.env.ALCHEMY_OPTIMISM_API_KEY,
  [ChainId.ARBITRUM]: process.env.ALCHEMY_ARBITRUM_API_KEY
}
const chainIdNetworkMap: { [key in ChainId]?: Network } = {
  [ChainId.ETHEREUM]: Network.ETH_MAINNET,
  [ChainId.POLYGON]: Network.MATIC_MAINNET,
  [ChainId.OPTIMISM]: Network.OPT_MAINNET,
  [ChainId.ARBITRUM]: Network.ARB_MAINNET
}

export default function scanner (chainId: ChainId): BalanceScanner {
  const alchemy = new Alchemy({
    apiKey: chainIdAlchemyAPIKeyMap[chainId],
    network: chainIdNetworkMap[chainId]
  })

  return async (address: string, contracts: string[]) => {
    let result: { [contract: string]: string } = {}
    const chunkSize = 100
    for (let i = 0; i < contracts.length; i += chunkSize) {
      const contractsChunk = contracts.slice(i, i + chunkSize)

      const { tokenBalances } = await alchemy.core.getTokenBalances(address, contractsChunk)
      const filteredTokenBalances = tokenBalances
        .filter(each => !each.error)

        // In case of Arbitrum One, zero balances are presumably encoded as '0x'.
        .filter(each => each.tokenBalance !== '0x')
        .filter(each => each.tokenBalance && !ethers.BigNumber.from(each.tokenBalance).isZero())

      result = filteredTokenBalances.reduce((acc, curr) => {
        return {
          ...acc,
          [curr.contractAddress]: ethers.BigNumber.from(curr.tokenBalance).toString()
        }
      }, result)
    }

    const nativeBalance = await alchemy.core.getBalance(address)
    if (!nativeBalance.isZero()) {
      result[''] = nativeBalance.toString()
    }

    return result
  }
}
