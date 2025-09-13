import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Simple Auth0 session presence check in middleware.
// If no session cookie for protected routes, redirect to Auth0 login.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isProtected = (
    pathname.startsWith('/merchant') ||
    pathname.startsWith('/api/minlp') ||
    pathname === '/dashboard'
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Default cookie set by @auth0/nextjs-auth0
  const hasSession = Boolean(req.cookies.get('appSession'));
  if (!hasSession) {
    const loginUrl = new URL('/api/auth/login', req.url);
    // Always send users to the dashboard after login
    loginUrl.searchParams.set('returnTo', '/dashboard');
    // Force Google connection for the gimmick flow
    loginUrl.searchParams.set('connection', 'google-oauth2');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/merchant/:path*', '/api/minlp/:path*', '/dashboard']
};
