import { Suspense } from 'react'
import Image from 'next/image'

import { ChainId } from '~/core/evm/types'
import { getOrResolveAddress } from '~/core/evm/address'

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

  try {
    const address = await getOrResolveAddress(account)
    return (
      <>
        <Suspense fallback={<Loader />}>
          {/* @ts-expect-error Async server component */}
          <NetworkBalances chainId={ChainId.ETHEREUM} address={address} />
        </Suspense>

        <Suspense fallback={<Loader />}>
          {/* @ts-expect-error Async server component */}
          <NetworkBalances chainId={ChainId.POLYGON} address={address} />
        </Suspense>

        <Suspense fallback={<Loader />}>
          {/* @ts-expect-error Async server component */}
          <NetworkBalances chainId={ChainId.BSC} address={address} />
        </Suspense>

        <Suspense fallback={<Loader />}>
          {/* @ts-expect-error Async server component */}
          <NetworkBalances chainId={ChainId.OPTIMISM} address={address} />
        </Suspense>

        <Suspense fallback={<Loader />}>
          {/* @ts-expect-error Async server component */}
          <NetworkBalances chainId={ChainId.ARBITRUM} address={address} />
        </Suspense>

        <Suspense fallback={<Loader />}>
          {/* @ts-expect-error Async server component */}
          <NetworkBalances chainId={ChainId.AVALANCHE} address={address} />
        </Suspense>
      </>
    )
  } catch (e) {
    return <>{e.message}</>
  }
}
