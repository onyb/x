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

async function Balance (props: { chainId: ChainId; account: string; slow: boolean }) {
  const { chainId, account, slow } = props

  if (slow) {
    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 1000)))
  }
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
  searchParams: {
    slow?: string
  }
}

export default async function Page (context: Props) {
  const { account } = context.params
  const { slow: slowStr } = context.searchParams
  const slow = slowStr !== 'false' && !!slowStr

  return (
    <>
      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.ETHEREUM} account={account} slow={slow} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.POLYGON} account={account} slow={slow} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.BSC} account={account} slow={slow} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.OPTIMISM} account={account} slow={slow} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.ARBITRUM} account={account} slow={slow} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <Balance chainId={ChainId.AVALANCHE} account={account} slow={slow} />
      </Suspense>
    </>
  )
}

export const config = {
  runtime: 'edge'
}
