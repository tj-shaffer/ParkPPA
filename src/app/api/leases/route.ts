import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    
    // If consumer, only return their leases
    // If admin, return all (or filtered by userId param)
    const where = session?.role === "ADMIN"
      ? (userId ? { userId } : {})
      : (session ? { userId: session.userId } : {});

    const leases = await prisma.lease.findMany({
      where,
      include: {
        garage: true,
        user: true,
        autoPay: true,
        payments: {
          orderBy: { dueDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leases);
  } catch (error) {
    console.error("GET /api/leases error:", error);
    return NextResponse.json({ error: "Failed to fetch leases" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { garageId, isResident, monthlyRate, make, model, plate } = body;

    if (!garageId) {
      return NextResponse.json({ error: "Missing garageId" }, { status: 400 });
    }

    const leaseNumber = `PGH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const notes = [
      make || model || plate ? `Vehicle: ${make} ${model} (${plate})` : "",
    ].filter(Boolean).join("\n");

    const lease = await prisma.lease.create({
      data: {
        leaseNumber,
        garageId,
        userId: session.userId,
        type: "TWENTY_FOUR_HR",
        monthlyRate,
        isResident,
        residentProofStatus: isResident ? "PENDING" : "VERIFIED",
        startDate: new Date(),
        status: "PENDING", // Requires PPA agent approval before activation
        notes,
      }
    });

    // Create an initial payment so the dashboard balance shows correctly
    await prisma.payment.create({
      data: {
        leaseId: lease.id,
        amount: monthlyRate,
        dueDate: new Date(),
        status: "PENDING",
      }
    });

    return NextResponse.json(lease);
  } catch (error) {
    console.error("POST /api/leases error:", error);
    return NextResponse.json({ error: "Failed to create lease" }, { status: 500 });
  }
}
