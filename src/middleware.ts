/**
 * Auth Middleware — ParkPGH
 *
 * Redirects unauthenticated users to /login on all consumer routes.
 * Verifies the JWT in the parkpgh_session cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "parkpgh-dev-secret"
);

const PROTECTED_PATHS = [
  "/dashboard",
  "/lease",
  "/payments",
  "/settings",
  "/apply",
  "/onboarding",
];

const PUBLIC_PATHS = [
  "/login",
  "/api",
  "/_next",
  "/favicon.ico",
  "/admin", // admin has its own auth guard in its layout
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Demo showcase: authentication is disabled. Let every route through and
  // rely on the demo session fallback in getSession() (see src/lib/auth.ts).
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.next();
  }

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check if this is a protected consumer route
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Verify session cookie
  const token = request.cookies.get("parkpgh_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Invalid or expired token — clear it and redirect
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("parkpgh_session");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
