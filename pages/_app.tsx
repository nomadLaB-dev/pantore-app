import type { AppProps } from 'next/app'
import type { NextPage } from 'next'
import type { ReactElement, ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import '../styles/globals.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import Providers from '@/components/providers'
import { Toaster } from 'sonner'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page: ReactElement) => page)

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} h-full antialiased min-h-full flex flex-col`}>
      <Providers>
        {getLayout(<Component {...pageProps} />)}
        <Toaster richColors position="top-right" />
      </Providers>
    </div>
  )
}
