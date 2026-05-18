import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/home/profile',
  '/home/documentos',
  '/home/busquedas',
  '/home/busqueda-ai',
  '/home/favoritos',
  '/home/mis-compras',
  '/home/checkout',
  '/home/confirmacion',
  '/home/notifications',
  '/admin',
];
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/resend-verification'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('__Secure-access_token')?.value || request.cookies.get('access_token')?.value || '';
  const refreshToken = request.cookies.get('__Secure-refresh_token')?.value || request.cookies.get('refresh_token')?.value || '';
  const isAuthenticated = !!accessToken;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (!isAuthenticated && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const returnUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/auth/login?returnUrl=${returnUrl}`, request.url));
  }

  // Redirect password-reset feature-flag pages when the feature is disabled
  if (process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET !== 'true') {
    if (pathname.startsWith('/auth/forgot-password') || pathname.startsWith('/auth/reset-password')) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
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
