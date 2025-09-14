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
    pathname.startsWith('/api/minlp') ||
    pathname.startsWith('/api/merchant')
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Allow merchant demo auth and APIs
  if (pathname.startsWith('/api/merchant')) {
    return NextResponse.next();
  }
  if (pathname.startsWith('/merchant/login') || pathname.startsWith('/merchant/logout')) {
    return NextResponse.next();
  }
  if (pathname.startsWith('/merchant')) {
    const hasMerchantSession = Boolean(req.cookies.get('merchant_session'));
    if (!hasMerchantSession) {
      const url = new URL('/merchant/login', req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // For non-merchant protected routes, fall back to app auth
  const hasSession = Boolean(req.cookies.get('appSession'));
  if (!hasSession) {
    const loginUrl = new URL('/api/auth/login', req.url);
    loginUrl.searchParams.set('returnTo', '/dashboard');
    loginUrl.searchParams.set('connection', 'google-oauth2');
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/merchant/:path*', '/api/minlp/:path*', '/api/merchant/:path*']
};
