import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const url = new URL(request.url);
    const leaseId = url.searchParams.get("leaseId");

    // Consumers only see their own payments
    const whereClause: Record<string, unknown> = {};
    
    if (leaseId) {
      whereClause.leaseId = leaseId;
    }

    if (session?.role !== "ADMIN") {
      // For consumers, get their lease IDs first
      if (session) {
        const userLeases = await prisma.lease.findMany({
          where: { userId: session.userId },
          select: { id: true },
        });
        whereClause.leaseId = { in: userLeases.map((l) => l.id) };
      }
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        lease: { include: { garage: true } },
      },
      orderBy: { dueDate: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
