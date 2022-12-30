import { ethers } from 'ethers'

export async function getOrResolveAddress (account: string) {
  try {
    const address = ethers.utils.getAddress(account)
    return address
  } catch (e) {
    const provider = new ethers.providers.JsonRpcProvider(
      `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ETHEREUM_API_KEY}`
    )
    const resolvedName = await provider.resolveName(account)
    if (!resolvedName) {
      throw new Error(`Failed to resolve ENS domain: ${account}`)
    }

    return resolvedName
  }
}
