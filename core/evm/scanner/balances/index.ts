import { ethers } from 'ethers'

import config from './config'
import { ChainId, TokenInfo, TokensList } from '~/core/evm/types'
import {
  getCoingeckoId,
  getTokenInfos,
  getTokenDecimals,
} from "~/core/coingecko";
import { getTokenExplorerUrl } from '~/core/evm/address'
import tokensList from '~/data/coingecko-ids.json'

function makeDummyNativeTokenInfo(chainId: ChainId): TokenInfo {
  switch (chainId) {
    case ChainId.Ethereum:
    case ChainId.Arbitrum:
    case ChainId.Optimism:
    case ChainId.Base:
      return {
        id: "ethereum",
        chainId,
        contractOrProgramAddress: "",
        name: "Ether",
        decimals: 18,
        symbol: "ETH",
        explorerUrl: "",
        logo: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png",
        price: 0,
      };
    
    case ChainId.Polygon:
      return {
        id: "matic-network",
        chainId,
        contractOrProgramAddress: "",
        name: "Polygon",
        decimals: 18,
        symbol: "POL",
        explorerUrl: "",
        logo: "https://assets.coingecko.com/coins/images/4713/standard/polygon.png",
        price: 0,
      };
    case ChainId.BnbSmartChain:
      return {
        id: "binancecoin",
        chainId,
        contractOrProgramAddress: "",
        name: "Binance Coin",
        decimals: 18,
        symbol: "BNB",
        explorerUrl: "",
        logo: "https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png",
        price: 0,
      };
    
    default:
      return {
        id: "",
        chainId,
        contractOrProgramAddress: "",
        name: "Unknown",
        decimals: 18,
        symbol: "???",
        explorerUrl: "",
        logo: "",
        price: 0,
      };
  }
}

export default async function scanner (chainId: ChainId, address: string) {
  const { scanner, ignoreContracts } = config[chainId]
  const tokens = Object.entries((tokensList as TokensList)[chainId]).map(([address, { id, decimals }]) => {
    return {
      chainId,
      contractOrProgramAddress: address,
      id,
      decimals,
    }
  }).filter(({ contractOrProgramAddress }) => !(ignoreContracts || []).includes(contractOrProgramAddress))

  const stream = scanner(
    address,
    tokens.map(({ contractOrProgramAddress }) => contractOrProgramAddress)
  )

  // Consume the stream
  // TODO: is it possible to render this stream asynchronously?
  const balances = []
  for await (const item of stream) {
    balances.push(item)
  }

  const tokenInfos = await getTokenInfos(balances.map(({ contractAddress }) => getCoingeckoId(contractAddress, chainId)));
  return balances.flatMap(({ balance, contractAddress }) => {
    const coingeckoId = getCoingeckoId(contractAddress, chainId)
    if (contractAddress) {
      const tokenInfo = tokenInfos.find((token) => token.id === coingeckoId);
      if (!tokenInfo) {
        return
      }

      const decimals = getTokenDecimals(contractAddress, chainId)

      return {
        balance: ethers.formatUnits(balance, decimals),
        token: {
          ...tokenInfo,
          contractOrProgramAddress: contractAddress,
          chainId,
          decimals,
          logo: tokenInfo.logo || '',
          explorerUrl: getTokenExplorerUrl(contractAddress, chainId),
          price: tokenInfo.price
        } as TokenInfo
      }
    }

    return {
      token: {
        ...makeDummyNativeTokenInfo(chainId),
        price: tokenInfos.find((token) => token.id === coingeckoId)?.price || 0
      },
      balance: ethers.formatEther(balance)
    }
  }).filter(e => e !== undefined)
}
