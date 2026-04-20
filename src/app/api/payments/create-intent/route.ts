import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createPaymentIntent } from "@/lib/stripe";

/**
 * POST /api/payments/create-intent
 * Create a Stripe PaymentIntent for a specific payment record.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    // Look up the payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        lease: {
          include: { garage: true, user: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify the user owns this payment (or is admin)
    if (session.role !== "ADMIN" && payment.lease.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Don't allow paying already-paid payments
    if (payment.status === "PAID") {
      return NextResponse.json({ error: "Payment already processed" }, { status: 400 });
    }

    // Create the PaymentIntent
    const amountCents = Math.round(parseFloat(payment.amount.toString()) * 100);

    const { clientSecret, paymentIntentId } = await createPaymentIntent(amountCents, {
      paymentId: payment.id,
      leaseId: payment.leaseId,
      garageName: payment.lease.garage.name,
      userId: payment.lease.userId,
    });

    // Store the PaymentIntent ID on the payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: { processorId: paymentIntentId, processor: "STRIPE" },
    });

    return NextResponse.json({ clientSecret });
  } catch (error) {
    console.error("POST /api/payments/create-intent error:", error);
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
