import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/perfil",
  "/documentos",
  "/busqueda-ai",
  "/favoritos",
  "/compras",
  "/checkout",
  "/confirmacion",
  "/admin",
];

const AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/resend-verification",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken =
    request.cookies.get("__Secure-access_token")?.value ||
    request.cookies.get("access_token")?.value ||
    "";
  const isAuthenticated = !!accessToken;

  const hasSessionExpired =
    request.nextUrl.searchParams.get("reason") === "session_expired";

  if (
    isAuthenticated &&
    AUTH_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    // Allow auth pages when the session is known to be broken (stale cookie
    // rejected by the backend). Without this guard, the AuthContext redirect
    // to /auth/login?reason=session_expired would be bounced back to / by
    // this middleware — an infinite refresh loop.
    if (hasSessionExpired) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    !isAuthenticated &&
    PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    const returnUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/auth/login?returnUrl=${returnUrl}`, request.url)
    );
  }

  if (process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET !== "true") {
    if (
      pathname.startsWith("/auth/forgot-password") ||
      pathname.startsWith("/auth/reset-password")
    ) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth/:path*",
    "/perfil/:path*",
    "/documentos/:path*",
    "/busqueda-ai/:path*",
    "/favoritos/:path*",
    "/compras/:path*",
    "/checkout/:path*",
    "/confirmacion/:path*",
    "/admin/:path*",
  ],
};
