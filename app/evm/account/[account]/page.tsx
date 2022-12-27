import { Suspense } from 'react'
import Image from 'next/image'

import Scanner from '~/core/evm/scanner/balances'
import { ChainId } from '~/core/evm/types'

import Skeleton from './skeleton.gif'

const chainIdToNetworkNameMap = {
  [ChainId.ETHEREUM]: 'Ethereum',
  [ChainId.BSC]: 'Binance Smart Chain',
  [ChainId.POLYGON]: 'Polygon',
  [ChainId.AVALANCHE]: 'Avalanche',
  [ChainId.OPTIMISM]: 'Optimism',
  [ChainId.ARBITRUM]: 'Arbitrum'
}

async function Balance (props: { chainId: ChainId; account: string }) {
  const { chainId, account } = props
  const balances = await Scanner(chainId, account)

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

function Loader () {
  return (
    <div>
      <Image src={Skeleton} alt='Loading...' height={140} />
    </div>
  )
}

type Props = {
  params: {
    account: string
  }
}

export default async function Page ({ params }: Props) {
  const { account } = params
  return (
    <>
      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.ETHEREUM} account={account} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.POLYGON} account={account} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.BSC} account={account} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.OPTIMISM} account={account} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.ARBITRUM} account={account} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.AVALANCHE} account={account} />
      </Suspense>
    </>
  )
}
