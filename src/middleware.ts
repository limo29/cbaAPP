import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Define the path for the login page
    const loginPath = '/login'

    // paths to exclude from authentication check
    const publicPaths = [
        loginPath,
        '/_next',
        '/api/login',
        '/favicon.ico',
        '/images', // assuming there might be an images folder
        '/icons',
    ]

    const path = request.nextUrl.pathname

    // Check if the path is public
    const isPublicPath = publicPaths.some(publicPath =>
        path.startsWith(publicPath)
    )

    if (isPublicPath) {
        return NextResponse.next()
    }

    // Check for the auth cookie
    const authToken = request.cookies.get('auth_token')

    // If no token is present, redirect to the login page
    if (!authToken) {
        const url = request.nextUrl.clone()
        url.pathname = loginPath
        // Add the original URL as a query parameter to redirect back specifically if needed, 
        // or just simple redirect
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes - generally want to protect these too, but maybe some are public? 
         *   The plan said protect all. But /api/login must be public.
         *   So I will NOT exclude /api globally in matcher, but handle it in logic)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - logo.png/svg (if any)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
