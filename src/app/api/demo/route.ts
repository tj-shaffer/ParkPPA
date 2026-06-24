import { NextRequest, NextResponse } from "next/server";

/**
 * Demo role switcher.
 *
 * Sets the `demo_role` cookie that getSession() (src/lib/auth.ts) reads to
 * resolve a seeded user without any login, then redirects into that side of
 * the app. Backs the top-right Consumer/Admin toggle.
 *
 *   GET /api/demo?role=consumer  → /dashboard
 *   GET /api/demo?role=admin     → /admin
 */
export async function GET(request: NextRequest) {
  const role =
    new URL(request.url).searchParams.get("role") === "admin" ? "admin" : "consumer";
  const dest = role === "admin" ? "/admin" : "/dashboard";

  const response = NextResponse.redirect(new URL(dest, request.url));
  response.cookies.set("demo_role", role, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
