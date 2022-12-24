import { getTokensBalance } from '@mycrypto/eth-scan'
import { ChainId } from '@core/evm/constants'

const config = {
  [ChainId.POLYGON]: {
    rpc: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGON_API_KEY}`,
    scannerContract: undefined
  },
  [ChainId.ETHEREUM]: {
    rpc: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ETHEREUM_API_KEY}`,
    scannerContract: undefined
  },
  [ChainId.BSC]: {
    rpc: 'https://bsc-dataseed.binance.org',
    scannerContract: '0x53242a975aa7c607e17138b0e0231162e3e68593'
  }
}

function discoverAssets (chainId: ChainId) {
  const providerConfig = config[chainId]

  return async (address: string, contracts: string[]) => {
    const result = await getTokensBalance(providerConfig.rpc, address, contracts, {
      batchSize: 100,
      contractAddress: providerConfig.scannerContract
    })

    const filteredResults = Object.entries(result)
      .filter(([_, balance]) => balance > 0)
      .map(([contract, balance]) => [contract, balance.toString()])

    return Object.fromEntries(filteredResults)
  }
}

export default discoverAssets
