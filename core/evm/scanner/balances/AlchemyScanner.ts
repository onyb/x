import { Alchemy, Network } from 'alchemy-sdk'

import { BalanceScanner, ChainId } from '~/core/evm/types'

const chainIdAlchemyAPIKeyMap: { [key in ChainId]?: string } = {
  [ChainId.Ethereum]: process.env.ALCHEMY_ETHEREUM_API_KEY,
  [ChainId.Polygon]: process.env.ALCHEMY_POLYGON_API_KEY,
  [ChainId.Optimism]: process.env.ALCHEMY_OPTIMISM_API_KEY,
  [ChainId.Arbitrum]: process.env.ALCHEMY_ARBITRUM_API_KEY
}
const chainIdNetworkMap: { [key in ChainId]?: Network } = {
  [ChainId.Ethereum]: Network.ETH_MAINNET,
  [ChainId.Polygon]: Network.MATIC_MAINNET,
  [ChainId.Optimism]: Network.OPT_MAINNET,
  [ChainId.Arbitrum]: Network.ARB_MAINNET
}

export default function scanner (chainId: ChainId): BalanceScanner {
  const alchemy = new Alchemy({
    apiKey: chainIdAlchemyAPIKeyMap[chainId],
    network: chainIdNetworkMap[chainId]
  })

  return async function * (address: string, contracts: string[]) {
    const nativeBalance = await alchemy.core.getBalance(address)
    if (!nativeBalance.isZero()) {
      yield {
        contractAddress: '',
        balance: nativeBalance.toString()
      }
    }

    const chunkSize = 100
    for (let i = 0; i < contracts.length; i += chunkSize) {
      const contractsChunk = contracts.slice(i, i + chunkSize)

      const { tokenBalances } = await alchemy.core.getTokenBalances(address, contractsChunk)
      const result = tokenBalances
        .filter(each => !each.error)

        // In case of Arbitrum One, zero balances are presumably encoded as '0x'.
        .filter(each => each.tokenBalance !== '0x' && each.tokenBalance !== '0x0')
        .map(each => ({
          contractAddress: each.contractAddress,
          balance: each.tokenBalance || '0'
        }))

      for (const each of result) {
        yield each
      }
    }
  }
}
