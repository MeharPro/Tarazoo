import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Middleware for protecting certain routes
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // If in demo mode, bypass auth for protected routes EXCEPT merchent area and dashboard
  if (
    process.env.DEMO_MODE === 'true' &&
    !pathname.startsWith('/merchent') &&
    !pathname.startsWith('/dashboard')
  ) {
    return NextResponse.next();
  }

  const { search } = req.nextUrl;

  const isProtected = (
    pathname.startsWith('/merchant') ||
    pathname.startsWith('/api/minlp') ||
    pathname.startsWith('/merchent')
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Default cookie set by auth provider
  const hasAppSession = Boolean(req.cookies.get('appSession'));
  const hasMerchentSession = Boolean(req.cookies.get('merchent_session'));

  // Allow merchent login page & merchent auth routes
  if (pathname.startsWith('/merchent/login') || pathname.startsWith('/api/merchent')) {
    return NextResponse.next();
  }

  if (!(hasAppSession || hasMerchentSession)) {
    // For any protected path, prefer merchent login screen by default
    const url = new URL('/merchent/login', req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/merchant/:path*', '/api/minlp/:path*', '/merchent/:path*', '/api/merchent/:path*', '/dashboard']
};
