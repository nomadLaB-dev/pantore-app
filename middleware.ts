import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // 1. Update session and get Supabase client & user
    const { supabase, response, user } = await updateSession(request)

    const path = request.nextUrl.pathname

    // Define routes
    const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/portal')
    const isAuthRoute = path.startsWith('/login')
    const isCreateTenantRoute = path === '/portal/create-tenant'

    // --- Main Redirect Logic ---

    // A. Handle unauthenticated users
    if (!user && isProtectedRoute) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        redirectUrl.searchParams.set('next', path)
        return NextResponse.redirect(redirectUrl)
    }

    // B. Handle authenticated users
    if (user) {
        // B1. Redirect away from auth routes if logged in
        if (isAuthRoute) {
            return NextResponse.redirect(new URL('/portal', request.url))
        }

        // B2. Check for tenant membership on protected routes
        if (isProtectedRoute) {
            const { count } = await supabase
                .from('memberships')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)

            // If user has no memberships and is not on the create-tenant page, redirect them.
            if (count === 0 && !isCreateTenantRoute) {
                return NextResponse.redirect(new URL('/portal/create-tenant', request.url))
            }

            // If user has memberships but somehow lands on create-tenant, redirect them away.
            if (count !== null && count > 0 && isCreateTenantRoute) {
                 return NextResponse.redirect(new URL('/portal', request.url))
            }
        }
    }

    // C. If no redirects, continue with the response
    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
