import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/notifications";

/**
 * POST /api/auth/send-otp
 * Send a 6-digit OTP code via email.
 * Auto-creates user if email doesn't exist in the system.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    if (!normalized.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // ─── Rate Limiting ────────────────────────────────────────────────────────
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCodes = await prisma.otpCode.count({
      where: {
        email: normalized,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (recentCodes >= 3) {
      return NextResponse.json(
        { error: "Too many code requests. Please wait a few minutes." },
        { status: 429 }
      );
    }

    // ─── Find or Create User ──────────────────────────────────────────────────
    let user = await prisma.user.findFirst({ where: { email: normalized } });

    if (!user) {
      // Auto-create account with just email — name filled in later
      user = await prisma.user.create({
        data: {
          email: normalized,
          firstName: "New",
          lastName: "User",
          role: "CONSUMER",
          notifyPreference: "EMAIL",
        },
      });
    }

    // ─── Generate & Store OTP ─────────────────────────────────────────────────
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.otpCode.create({
      data: {
        email: normalized,
        code,
        expiresAt,
      },
    });

    // ─── Send Email ───────────────────────────────────────────────────────────
    // DEV: Log the code to console so you can test the flow even if Email fails
    console.log(`\n🔑 OTP CODE for ${normalized}: ${code}\n`);

    const result = await sendEmail(
      normalized,
      "Your ParkPGH Login Code",
      `<p>Your ParkPGH code is: <strong>${code}</strong></p><p>This code expires in 5 minutes. Do not share it with anyone.</p>`
    );

    if (!result.success) {
      console.error("Failed to send OTP email:", result.error);
      // In dev, still return success so you can use the code from the console
      if (process.env.NODE_ENV !== "production") {
        console.log(`⚠️  SMS failed but dev mode — use code from console above`);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { error: "Failed to send code. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/send-otp error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
