import Scanner from '~/core/evm/scanner/balances'
import { ChainId } from '~/core/evm/types'

const chainIdToNetworkNameMap = {
  [ChainId.ETHEREUM]: 'Ethereum',
  [ChainId.BSC]: 'Binance Smart Chain',
  [ChainId.POLYGON]: 'Polygon',
  [ChainId.AVALANCHE]: 'Avalanche',
  [ChainId.OPTIMISM]: 'Optimism',
  [ChainId.ARBITRUM]: 'Arbitrum'
}

type Props = {
  chainId: ChainId
  address: string
}

export default async function NetworkBalances (props: Props) {
  const { chainId, address } = props

  const balances = await Scanner(chainId, address)
  if (balances.length === 0) {
    return null
  }

  return (
    <div>
      <div style={{ backgroundColor: '#69d2e7', fontWeight: 600 }}>
        {chainIdToNetworkNameMap[chainId]}
      </div>
      <ul>
        {balances.map(({ token, balance }) => (
          <li key={token.address}>
            {balance} {token.symbol}
          </li>
        ))}
      </ul>
    </div>
  )
}
