import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // 1. Update session (refresh token if needed)
    const { response, user } = await updateSession(request)

    const path = request.nextUrl.pathname

    // 2. Define protected routes
    // /dashboard, /portal are protected
    const isProtectedRoute = path.startsWith('/dashboard') || path.startsWith('/portal')

    // 3. Define auth routes (login/signup)
    // Users should not visit these if already logged in
    const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup')

    // 4. Redirect logic
    if (isProtectedRoute && !user) {
        // If trying to access protected route without user, redirect to login
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        redirectUrl.searchParams.set('next', path) // Save original path
        return NextResponse.redirect(redirectUrl)
    }

    if (isAuthRoute && user) {
        // If trying to access login page with user, redirect to dashboard (or portal)
        const redirectUrl = request.nextUrl.clone()
        // TODO: Role based redirect (Admin -> Dashboard, User -> Portal)
        // For now default to dashboard, or maybe check user metadata if available
        redirectUrl.pathname = '/portal'
        return NextResponse.redirect(redirectUrl)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes - handled separately if needed, but usually we want middleware there too? 
         *   Actually for API routes we might want to return 401 instead of redirect. 
         *   For now let's exclude them from this redirect logic or handle them specifically.)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
