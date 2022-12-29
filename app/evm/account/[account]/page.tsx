import { Suspense } from 'react'
import Image from 'next/image'

import { ChainId } from '~/core/evm/types'

import Skeleton from './skeleton.gif'
import NetworkBalances from './(components)/NetworkBalances'

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

export default async function Page (context: Props) {
  const { account } = context.params

  return (
    <>
      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <NetworkBalances chainId={ChainId.ETHEREUM} account={account} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <NetworkBalances chainId={ChainId.POLYGON} account={account} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <NetworkBalances chainId={ChainId.BSC} account={account} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <NetworkBalances chainId={ChainId.OPTIMISM} account={account} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <NetworkBalances chainId={ChainId.ARBITRUM} account={account} />
      </Suspense>

      <Suspense fallback={<Loader />}>
        {/* @ts-expect-error Async server component */}
        <NetworkBalances chainId={ChainId.AVALANCHE} account={account} />
      </Suspense>
    </>
  )
}
