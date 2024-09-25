export enum ChainId {
  Ethereum = "0x1",
  BnbSmartChain = "0x38",
  Arbitrum = "0xa4b1",
  Base = "0x2105",
  Polygon = "0x89",
  Optimism = "0xa",
}

export type BalanceScanner = (
  address: string,
  contracts: string[]
) => AsyncGenerator<
  {
    contractAddress: string
    balance: string
  },
  void
>

export type TokensList = {
  [chainId: string]: {
    [contractOrProgramAddress: string]: {
      id: string;
      decimals: number;
    };
  };
};

export type TokenInfo = {
  id: string
  chainId: string
  contractOrProgramAddress: string
  name: string
  decimals: number
  symbol: string
  logo: string
  explorerUrl: string
  price: number
};
