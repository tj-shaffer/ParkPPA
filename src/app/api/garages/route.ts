import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const garages = await prisma.garage.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { leases: true } },
      },
    });
    return NextResponse.json(garages);
  } catch (error) {
    console.error("GET /api/garages error:", error);
    return NextResponse.json({ error: "Failed to fetch garages" }, { status: 500 });
  }
}
