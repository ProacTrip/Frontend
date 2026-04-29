import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/home', '/admin'];
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/resend-verification'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get('__Secure-access_token');
  const refreshToken = request.cookies.get('__Secure-refresh_token');
  const isAuthenticated = !!accessToken || !!refreshToken;

  if (isAuthenticated && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/home/:path*',
    '/admin/:path*',
  ],
};
