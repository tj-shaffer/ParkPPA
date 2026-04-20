import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const garage = await prisma.garage.findUnique({
      where: { id },
      include: {
        leases: {
          include: { user: true, payments: { take: 1, orderBy: { dueDate: "desc" } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!garage) {
      return NextResponse.json({ error: "Garage not found" }, { status: 404 });
    }

    return NextResponse.json(garage);
  } catch (error) {
    console.error("GET /api/garages/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch garage" }, { status: 500 });
  }
}
