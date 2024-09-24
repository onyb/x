const supportedChainIds = [
  "0x1",    // Ethereum
  "0x38",   // BNB Smart Chain
  "0xa4b1", // Arbitrum
  "0x2105", // Base
  "0x89",   // Polygon
  "0xa",    // Optimism
]

const generateCoingeckoIds = async () => {
  const coinGeckoApiBaseUrl = "https://api.coingecko.com/api/v3"

  // Fetch the list of tokens from CoinGecko
  const coinListResponse = await fetch(
    `${coinGeckoApiBaseUrl}/coins/list?include_platform=true`
  )
  if (!coinListResponse.ok) {
    throw new Error(
      `Error fetching coin list from CoinGecko:
      ${coinListResponse.status} ${coinListResponse.statusText}`
    )
  }
  const coinList = await coinListResponse.json()

  const assetPlatformsResponse = await fetch(
    `${coinGeckoApiBaseUrl}/asset_platforms`
  )
  if (!assetPlatformsResponse.ok) {
    throw new Error(
      `Error fetching asset platforms from CoinGecko:
      ${assetPlatformsResponse.status} ${assetPlatformsResponse.statusText}`
    )
  }
  const assetPlatformsList = await assetPlatformsResponse.json()
  const assetPlatformsMap = assetPlatformsList.reduce((acc, platform) => {
    // Manually add Solana chain identifier since it's not in the CoinGecko
    // asset platforms list
    if (platform.id === "solana" && !platform.chain_identifier) {
      platform.chain_identifier = 101
    }

    acc[platform.id] = platform.chain_identifier
    return acc
  }, {})

  const coingeckoIdsByChainId = coinList.reduce((acc, coin) => {
    Object.entries(coin.platforms).forEach(([platform, contractAddress]) => {
      const chainId = assetPlatformsMap[platform]
      if (!chainId || !contractAddress) {
        return
      }

      const chainIdHex = `0x${chainId.toString(16)}`;

      if (!supportedChainIds.includes(chainIdHex)) {
        return;
      }

      if (acc[chainIdHex]) {
        acc[chainIdHex][contractAddress] = coin.id
      } else {
        acc[chainIdHex] = {
          [contractAddress]: coin.id,
        }
      }
    })

    return acc
  }, {})

  return Object.fromEntries(
    Object.keys(coingeckoIdsByChainId).map((chainId) => [
      chainId,
      {
        ...coingeckoIdsByChainId[chainId],
      },
    ])
  )
}

generateCoingeckoIds()
  .then(r => console.log(r))
