import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { password } = body

        // Use environment variable with fallback to "kjg" as requested
        const sitePassword = process.env.SITE_PASSWORD || 'kjg'

        if (password === sitePassword) {
            const response = NextResponse.json({ success: true })

            // Set the cookie
            // HttpOnly: accessible only by the web server
            // Secure: sent only over HTTPS (should be true in production)
            // MaxAge: 30 days (example)
            response.cookies.set('auth_token', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
            })

            return response
        }

        return NextResponse.json(
            { success: false, message: 'Invalid password' },
            { status: 401 }
        )
    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'An error occurred' },
            { status: 500 }
        )
    }
}
