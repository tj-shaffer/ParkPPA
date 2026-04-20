import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink, createSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const user = await verifyMagicLink(token);

  if (!user) {
    // Invalid or expired link — redirect to login with error
    return NextResponse.redirect(
      new URL("/login?error=invalid_link", request.url)
    );
  }

  // Create session cookie
  await createSession(user.id, user.role);

  // Redirect based on role
  const redirectTo = user.role === "ADMIN" ? "/admin" : "/dashboard";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
