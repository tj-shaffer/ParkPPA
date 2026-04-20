import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createSession } from "@/lib/auth";

/**
 * DEV ONLY — Quick login as consumer or admin for demo purposes.
 * Usage: GET /api/auth/dev-login?role=consumer or ?role=admin
 * This bypasses the magic link flow for faster testing.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const url = new URL(request.url);
  const role = url.searchParams.get("role") || "consumer";

  const user = await prisma.user.findFirst({
    where: { role: role === "admin" ? "ADMIN" : "CONSUMER" },
  });

  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 404 });
  }

  await createSession(user.id, user.role);

  const redirectTo = role === "admin" ? "/admin" : "/dashboard";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
