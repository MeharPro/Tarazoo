import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Middleware for protecting certain routes
export function middleware(req: NextRequest) {
  // If in demo mode, bypass auth for protected routes
  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.next();
  }

  const { pathname, search } = req.nextUrl;

  const isProtected = (
    pathname.startsWith('/merchant') ||
    pathname.startsWith('/api/minlp')
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Default cookie set by auth provider
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
  matcher: ['/merchant/:path*', '/api/minlp/:path*']
};
