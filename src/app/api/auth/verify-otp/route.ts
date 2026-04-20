import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createSession } from "@/lib/auth";

/**
 * POST /api/auth/verify-otp
 * Verify the 6-digit code and create a session if valid.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalized = email.toLowerCase().trim();

    // Find the most recent unused OTP for this email
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email: normalized,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Code expired or not found. Please request a new one." },
        { status: 400 }
      );
    }

    // ─── Brute-force protection ───────────────────────────────────────────────
    if (otpRecord.attempts >= 5) {
      // Burn the code
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Increment attempts
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });

    // ─── Verify code ──────────────────────────────────────────────────────────
    if (otpRecord.code !== code.trim()) {
      const remaining = 5 - (otpRecord.attempts + 1);
      return NextResponse.json(
        { error: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
        { status: 400 }
      );
    }

    // Mark as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // ─── Find user & create session ───────────────────────────────────────────
    const user = await prisma.user.findFirst({ where: { email: normalized } });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found. Please try again." },
        { status: 404 }
      );
    }

    await createSession(user.id, user.role);

    // Check if this is a "New User" (placeholder name)
    const isNewUser = user.firstName === "New" && user.lastName === "User";

    return NextResponse.json({
      success: true,
      isNewUser,
      role: user.role,
      redirectTo: user.role === "ADMIN" ? "/admin" : "/dashboard",
    });
  } catch (error) {
    console.error("POST /api/auth/verify-otp error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
