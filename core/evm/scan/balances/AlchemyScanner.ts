import { Alchemy, Network } from 'alchemy-sdk'
import { ethers } from 'ethers'

import { ChainId } from '@core/evm/constants'

function discoverAssets (chainId: ChainId) {
  const alchemy = new Alchemy({
    apiKey:
      chainId === ChainId.ETHEREUM
        ? process.env.ALCHEMY_ETHEREUM_API_KEY
        : chainId === ChainId.POLYGON
          ? process.env.ALCHEMY_POLYGON_API_KEY
          : undefined,
    network:
      chainId === ChainId.ETHEREUM
        ? Network.ETH_MAINNET
        : chainId === ChainId.POLYGON
          ? Network.MATIC_MAINNET
          : undefined
  })

  return async (address: string, contracts: string[]) => {
    let result = {}
    const chunkSize = 100
    for (let i = 0; i < contracts.length; i += chunkSize) {
      const contractsChunk = contracts.slice(i, i + chunkSize)

      const { tokenBalances } = await alchemy.core.getTokenBalances(address, contractsChunk)
      const filteredTokenBalances = tokenBalances
        .filter(each => !each.error)
        .filter(each => each.tokenBalance && !ethers.BigNumber.from(each.tokenBalance).isZero())

      result = filteredTokenBalances.reduce((acc, curr) => {
        return {
          ...acc,
          [curr.contractAddress]: ethers.BigNumber.from(curr.tokenBalance).toString()
        }
      }, result)
    }

    return result
  }
}

export default discoverAssets
