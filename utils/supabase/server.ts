import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type cookies } from 'next/headers'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return (cookieStore as any)[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          // No more try-catch, to expose potential errors
          (cookieStore as any).set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          // No more try-catch, to expose potential errors
          (cookieStore as any).delete(name, options)
        },
      },
    }
  )
}

export function createAdminClient() {
    // Note: This should only be used in server-side actions and routes
    // where you have validated user permissions.
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}
