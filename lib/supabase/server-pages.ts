import { createServerClient } from '@supabase/ssr'
import { serialize } from 'cookie'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { GetServerSidePropsContext } from 'next'

type Req = NextApiRequest | GetServerSidePropsContext['req']
type Res = NextApiResponse | GetServerSidePropsContext['res']

export function createClient(req: Req, res: Res) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies ?? {}).map(([name, value]) => ({
            name,
            value: value ?? '',
          }))
        },
        setAll(cookiesToSet) {
          const existing = res.getHeader('Set-Cookie')
          const existingArr = Array.isArray(existing)
            ? existing
            : existing
              ? [String(existing)]
              : []
          const newCookies = cookiesToSet.map(({ name, value, options }) =>
            serialize(name, value, {
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              ...options,
            })
          )
          res.setHeader('Set-Cookie', [...existingArr, ...newCookies])
        },
      },
    }
  )
}
