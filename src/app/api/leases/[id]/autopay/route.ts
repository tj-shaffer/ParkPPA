import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * PATCH /api/leases/[id]/autopay
 * Toggle Auto-Pay for a specific lease.
 * Body: { enabled: boolean }
 *
 * When enabling:
 *   - Requires an existing AutoPay record with a stripePaymentMethodId
 *   - If no payment method is saved, returns 400 with a message
 *
 * When disabling:
 *   - Sets autoPay.enabled = false (card stays on file)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const lease = await prisma.lease.findUnique({
      where: { id },
      include: { autoPay: true },
    });

    if (!lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    if (session.role !== "ADMIN" && lease.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "'enabled' must be a boolean" },
        { status: 400 }
      );
    }

    // Enabling: check that a payment method is on file
    if (enabled) {
      if (!lease.autoPay?.stripePaymentMethodId) {
        return NextResponse.json(
          {
            error: "No payment method on file. Please add a card first.",
            code: "NO_PAYMENT_METHOD",
          },
          { status: 400 }
        );
      }

      await prisma.autoPay.update({
        where: { leaseId: id },
        data: { enabled: true },
      });
    } else {
      // Disabling: just turn it off, keep card on file
      if (lease.autoPay) {
        await prisma.autoPay.update({
          where: { leaseId: id },
          data: { enabled: false },
        });
      }
    }

    // Return updated lease
    const updated = await prisma.lease.findUnique({
      where: { id },
      include: {
        garage: true,
        autoPay: true,
        payments: { orderBy: { dueDate: "desc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/leases/[id]/autopay error:", error);
    return NextResponse.json(
      { error: "Failed to update auto-pay" },
      { status: 500 }
    );
  }
}
