import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password']
const authRoutes = ['/login', '/signup']

function isValidCallbackUrl(callbackUrl: string, origin: string): boolean {
  // Only allow relative paths starting with /
  if (!callbackUrl.startsWith('/')) {
    return false
  }
  // Prevent protocol-relative URLs (//evil.com)
  if (callbackUrl.startsWith('//')) {
    return false
  }
  // Validate the URL resolves to the same origin
  try {
    const resolved = new URL(callbackUrl, origin)
    return resolved.origin === origin
  } catch {
    return false
  }
}

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isPublicRoute = publicRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith('/api/auth')
  )
  const isAuthRoute = authRoutes.includes(nextUrl.pathname)

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/capture', nextUrl))
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Redirect non-logged-in users to login
  if (!isLoggedIn) {
    const requestedPath = nextUrl.pathname + nextUrl.search
    const callbackUrl = isValidCallbackUrl(requestedPath, nextUrl.origin)
      ? encodeURIComponent(requestedPath)
      : encodeURIComponent('/capture')
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
