import { ethers } from 'ethers'

import { ChainId } from '~/core/evm/types'
import { rpcConfig } from '../config'

export async function getOrResolveAddress (account: string) {
  try {
    const address = ethers.getAddress(account)
    return address
  } catch (e) {
    const provider = new ethers.JsonRpcProvider(rpcConfig[ChainId.Ethereum]);
    const resolvedName = await provider.resolveName(account)
    if (!resolvedName) {
      throw new Error(`Failed to resolve ENS domain: ${account}`)
    }

    return resolvedName
  }
}

export function getAddressExplorerUrl(address: string, chainId: ChainId) {
  switch (chainId) {
    case ChainId.Ethereum:
      return `https://etherscan.io/address/${address}`
    case ChainId.Polygon:
      return `https://polygonscan.com/address/${address}`
    case ChainId.BnbSmartChain:
      return `https://bscscan.com/address/${address}`
    case ChainId.Optimism:
      return `https://optimistic.etherscan.io/address/${address}`
    case ChainId.Arbitrum:
      return `https://arbiscan.io/address/${address}`
    case ChainId.Base:
      return `https://basescan.org/address/${address}`
    default:
      return ''
  }
}

export function getTokenExplorerUrl(address: string, chainId: ChainId) {
  if (!address) {
    return ''
  }

  switch (chainId) {
    case ChainId.Ethereum:
      return `https://etherscan.io/token/${address}`
    case ChainId.Polygon:
      return `https://polygonscan.com/token/${address}`
    case ChainId.BnbSmartChain:
      return `https://bscscan.com/token/${address}`
    case ChainId.Optimism:
      return `https://optimistic.etherscan.io/token/${address}`
    case ChainId.Arbitrum:
      return `https://arbiscan.io/token/${address}`
    case ChainId.Base:
      return `https://basescan.org/token/${address}`
    default:
      return ''
  }
}