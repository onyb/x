const fs = require('fs')
const env = require('@next/env')
const { ethers } = require('ethers')

const { loadEnvConfig } = env
loadEnvConfig(process.cwd())

const rpcConfig = {
  '0x1': `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  '0x38': 'https://rpc.ankr.com/bsc',
  '0xa4b1': `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  '0x2105': `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  '0x89': `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  '0xa': `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
}

// Keep this list synced with the ChainId enum in core/evm/types.ts
const supportedChainIds = [
  '0x1', // Ethereum
  '0xa4b1', // Arbitrum
  '0x2105', // Base
  '0x89', // Polygon
  '0xa', // Optimism
]

const getDecimals = async (chainId, contractAddress) => {
  const provider = new ethers.JsonRpcProvider(rpcConfig[chainId])
  const contract = new ethers.Contract(
    contractAddress,
    ['function decimals() view returns (uint8)'],
    provider,
  )

  return Number(await contract.decimals())
}

const generateCoingeckoIds = async () => {
  const coinGeckoApiBaseUrl = 'https://api.coingecko.com/api/v3'

  // Fetch the list of tokens from CoinGecko
  const coinListResponse = await fetch(
    `${coinGeckoApiBaseUrl}/coins/list?include_platform=true`,
  )
  if (!coinListResponse.ok) {
    throw new Error(
      `Error fetching coin list from CoinGecko:
      ${coinListResponse.status} ${coinListResponse.statusText}`,
    )
  }
  const coinList = await coinListResponse.json()

  const assetPlatformsResponse = await fetch(
    `${coinGeckoApiBaseUrl}/asset_platforms`,
  )
  if (!assetPlatformsResponse.ok) {
    throw new Error(
      `Error fetching asset platforms from CoinGecko:
      ${assetPlatformsResponse.status} ${assetPlatformsResponse.statusText}`,
    )
  }
  const assetPlatformsList = await assetPlatformsResponse.json()
  const assetPlatformsMap = assetPlatformsList.reduce((acc, platform) => {
    // Manually add Solana chain identifier since it's not in the CoinGecko
    // asset platforms list
    if (platform.id === 'solana' && !platform.chain_identifier) {
      platform.chain_identifier = 101
    }

    acc[platform.id] = platform.chain_identifier
    return acc
  }, {})

  const coingeckoIdsByChainId = await coinList.reduce(
    async (accPromise, coin) => {
      const acc = await accPromise

      for (const [platform, contractAddress] of Object.entries(
        coin.platforms,
      )) {
        const chainId = assetPlatformsMap[platform]
        if (!chainId || !contractAddress) {
          continue
        }

        const chainIdHex = `0x${chainId.toString(16)}`

        if (!supportedChainIds.includes(chainIdHex)) {
          continue
        }

        // Record time taken to fetch decimals for each token
        const start = Date.now()
        let decimals
        try {
          decimals = Number(await getDecimals(chainIdHex, contractAddress))
        } catch (e) {
          console.error(
            `Error fetching decimals for token ${coin.id} on chain ${chainIdHex}: ${e.message}`,
          )
          continue
        }
        const end = Date.now()

        if (acc[chainIdHex]) {
          acc[chainIdHex][contractAddress] = {
            id: coin.id,
            decimals,
          }
        } else {
          acc[chainIdHex] = {
            [contractAddress]: {
              id: coin.id,
              decimals,
            },
          }
        }

        console.log(
          `id=${
            coin.id
          } chainId=${chainIdHex} contract=${contractAddress} decimals=${decimals}  [${
            end - start
          }ms]`,
        )
      }

      return acc
    },
    Promise.resolve({}),
  )

  return Object.fromEntries(
    Object.keys(coingeckoIdsByChainId).map((chainId) => [
      chainId,
      {
        ...coingeckoIdsByChainId[chainId],
      },
    ]),
  )
}

// Write the output to the data/coingecko-ids.json file
generateCoingeckoIds().then((coingeckoIdsByChainId) => {
  fs.writeFileSync(
    'data/coingecko-ids.json',
    JSON.stringify(coingeckoIdsByChainId, null, 2),
  )
})
