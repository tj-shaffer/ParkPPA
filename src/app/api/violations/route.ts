import { NextResponse } from "next/server";

const MOCK_VIOLATIONS = [
  {
    id: "V-2024-001",
    citationNumber: "PGH-2024-00123",
    licensePlate: "ABC1234",
    state: "PA",
    violationDate: "2024-11-15T14:30:00Z",
    location: "500 Grant St, Pittsburgh, PA",
    violationType: "Expired Meter",
    fineAmount: "50.00",
    status: "UNPAID",
    dueDate: "2025-12-15T23:59:59Z",
  },
  {
    id: "V-2024-002",
    citationNumber: "PGH-2024-00456",
    licensePlate: "ABC1234",
    state: "PA",
    violationDate: "2024-10-03T09:15:00Z",
    location: "100 Forbes Ave, Pittsburgh, PA",
    violationType: "No Parking Zone",
    fineAmount: "75.00",
    status: "PAID",
    dueDate: "2024-11-03T23:59:59Z",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const plate = searchParams.get("plate")?.toUpperCase().replace(/\s/g, "");
    const state = searchParams.get("state")?.toUpperCase() || "PA";

    if (!plate) {
      return NextResponse.json({ error: "License plate is required" }, { status: 400 });
    }

    const violations = MOCK_VIOLATIONS.filter(
      (v) => v.licensePlate === plate && v.state === state
    );

    return NextResponse.json({ violations, plate, state });
  } catch (error) {
    console.error("Violations lookup error:", error);
    return NextResponse.json({ error: "Failed to fetch violations" }, { status: 500 });
  }
}