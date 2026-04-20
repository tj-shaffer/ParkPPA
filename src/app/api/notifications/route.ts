import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendSMS } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const notifications = await prisma.notification.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { message, channel, recipientType } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Find target users based on recipientType
    let users;
    if (recipientType === "all") {
      users = await prisma.user.findMany({ where: { role: "CONSUMER" } });
    } else if (recipientType === "past_due") {
      const pastDueLeases = await prisma.payment.findMany({
        where: { status: "PAST_DUE" },
        select: { lease: { select: { userId: true } } },
        distinct: ["leaseId"],
      });
      const userIds = pastDueLeases.map((p) => p.lease.userId);
      users = await prisma.user.findMany({ where: { id: { in: userIds } } });
    } else {
      users = await prisma.user.findMany({ where: { role: "CONSUMER" } });
    }

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      const shouldSMS = (channel === "SMS" || channel === "BOTH") && user.phone;

      if (shouldSMS && user.phone) {
        const result = await sendSMS(user.phone, message);
        
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "CUSTOM",
            channel: "SMS",
            content: message,
            status: result.success ? "SENT" : "FAILED",
            sentAt: result.success ? new Date() : null,
          },
        });

        if (result.success) sent++;
        else failed++;
      }
    }

    return NextResponse.json({ success: true, sent, failed });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
