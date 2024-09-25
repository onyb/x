import { ChainId } from '~/core/evm/types'

type RpcConfig = {
  [key in ChainId]: string
}

export const rpcConfig: RpcConfig = {
  [ChainId.Polygon]: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  [ChainId.Ethereum]: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  [ChainId.Base]: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  [ChainId.BnbSmartChain]: 'https://rpc.ankr.com/bsc',
  [ChainId.Optimism]: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  [ChainId.Arbitrum]: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
}
