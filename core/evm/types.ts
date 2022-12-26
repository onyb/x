export enum ChainId {
  ETHEREUM = '0x1',
  POLYGON = '0x89',
  BSC = '0x38',
  AVALANCHE = '0xa86a',
  OPTIMISM = '0xa',
  ARBITRUM = '0xa4b1'
}

export type BalanceScanner = (
  address: string,
  contracts: string[]
) => Promise<{ [contract: string]: string }>
