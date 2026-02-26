import { NextResponse } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password', '/']

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Normalize pathname by removing trailing slash (except for root)
  const normalizedPath = pathname !== '/' && pathname.endsWith('/') 
    ? pathname.slice(0, -1) 
    : pathname

  // Check if the route is public (handle both with and without trailing slashes)
  const isPublicRoute = publicRoutes.some(route => 
    normalizedPath === route || 
    normalizedPath.startsWith(route + '/') ||
    pathname.startsWith('/api/auth')
  )

  // Allow public routes and API routes
  if (isPublicRoute || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check for authentication cookie
  const authToken = request.cookies.get('auth-token')

  // If no auth token and route is not public, redirect to login
  // But don't redirect if we're already going to login (to avoid loops)
  if (!authToken && normalizedPath !== '/login') {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', normalizedPath)
    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

