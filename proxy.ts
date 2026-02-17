import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    })

    const { pathname } = request.nextUrl

    // If user is NOT authenticated and trying to access protected routes → redirect to login
    if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/profile'))) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // If user IS authenticated and trying to access auth pages → redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/profile/:path*', '/login', '/register'],
}
