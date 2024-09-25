import { ethers } from 'ethers'
import { mapLimit } from "async";
import { getTokensBalance } from '@mycrypto/eth-scan'

import { rpcConfig } from '~/core/evm/config'
import { ChainId, BalanceScanner } from '~/core/evm/types'

type ScannerConfig = {
  [key in ChainId]: { rpc: string; scannerContract?: string }
}

const maxBalanceScanBatchSize = 1000

const config: ScannerConfig = {
  [ChainId.Polygon]: {
    rpc: rpcConfig[ChainId.Polygon],
    scannerContract: "0x08A8fDBddc160A7d5b957256b903dCAb1aE512C5",
  },
  [ChainId.Ethereum]: {
    rpc: rpcConfig[ChainId.Ethereum],
    scannerContract: "0x08A8fDBddc160A7d5b957256b903dCAb1aE512C5",
  },
  [ChainId.Base]: {
    rpc: rpcConfig[ChainId.Base],
    scannerContract: "0x03548baf9123b7d9d3b9b74469be11028f2b86a4",
  },
  [ChainId.BnbSmartChain]: {
    rpc: rpcConfig[ChainId.BnbSmartChain],
    scannerContract: "0x53242a975aa7c607e17138b0e0231162e3e68593",
  },
  [ChainId.Optimism]: {
    rpc: rpcConfig[ChainId.Optimism],
    scannerContract: "0x9e5076DF494FC949aBc4461F4E57592B81517D81",
  },
  [ChainId.Arbitrum]: {
    rpc: rpcConfig[ChainId.Arbitrum],
    scannerContract: "0xa3e7eb35e779f261ca604138d41d0258e995e97b",
  },
};

export default function scanner(chainId: ChainId): BalanceScanner {
  const providerConfig = config[chainId]
  const provider = new ethers.JsonRpcProvider(providerConfig.rpc)

  return async function * (address: string, contracts: string[]) {
    const nativeBalance = await provider.getBalance(address)
    if (nativeBalance > 0) {
      yield {
        contractAddress: '',
        balance: nativeBalance.toString()
      }
    }

    const chunkedContracts = []
    for (let i = 0; i < contracts.length; i += maxBalanceScanBatchSize) {
      chunkedContracts.push(contracts.slice(i, i + maxBalanceScanBatchSize));
    }

    const concurrency =
      contracts.length <= maxBalanceScanBatchSize ? 1 : chunkedContracts.length;

    const start = Date.now()
    const result = await mapLimit(
      concurrency === 1 ? [contracts] : chunkedContracts,
      concurrency,
      async (chunk: string[]) => {
        if (chunk.length === 0) {
          return [];
        }

        return await getTokensBalance(provider, address, chunk, {
          contractAddress: providerConfig.scannerContract,
        });
      }
    );

    const balanceMap = result
      .flat()
      .reduce((acc, e) => Object.assign(acc, e), {});

    console.log(`getTokensBalance() address=${address} tokens=${contracts.length} concurrency=${concurrency} [${Date.now() - start}ms]`)

    const balances = Object.entries(balanceMap).filter(
      ([_, balance]) => balance > 0
    )

    for (const [contract, balance] of balances) {
      yield {
        contractAddress: contract,
        balance: balance.toString()
      }
    }
  }
}
