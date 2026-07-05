import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // Paths that do not require authentication
  const publicPaths = ['/login', '/register', '/forgot-password', '/search'];
  
  // If the path is public, let them proceed (or redirect away from login if they have a token)
  if (publicPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    if (token && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Paths that require authentication
  // We want to protect basically everything else (home page, profile, etc.)
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
