import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import stripe from "@/lib/stripe";

/**
 * POST /api/payments/methods/confirm
 * Called after a successful Stripe SetupIntent confirmation.
 * Saves the payment method details to the local database (AutoPay record)
 * so the app doesn't depend solely on the Stripe webhook.
 *
 * Body: { setupIntentId: string, leaseId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { setupIntentId, leaseId } = await request.json();

    if (!setupIntentId) {
      return NextResponse.json(
        { error: "setupIntentId is required" },
        { status: 400 }
      );
    }

    // Retrieve the SetupIntent from Stripe to get the payment method
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    if (setupIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "SetupIntent has not succeeded" },
        { status: 400 }
      );
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "No payment method found on SetupIntent" },
        { status: 400 }
      );
    }

    // Retrieve card details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (!paymentMethod.card) {
      return NextResponse.json(
        { error: "Payment method is not a card" },
        { status: 400 }
      );
    }

    // Determine which lease to update
    const targetLeaseId =
      leaseId ||
      setupIntent.metadata?.leaseId;

    if (!targetLeaseId) {
      return NextResponse.json(
        { error: "Could not determine lease" },
        { status: 400 }
      );
    }

    // Verify the lease belongs to this user
    const lease = await prisma.lease.findUnique({
      where: { id: targetLeaseId },
    });

    if (!lease || (session.role !== "ADMIN" && lease.userId !== session.userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Upsert the AutoPay record with card details
    await prisma.autoPay.upsert({
      where: { leaseId: targetLeaseId },
      update: {
        stripePaymentMethodId: paymentMethod.id,
        cardLast4: paymentMethod.card.last4,
        cardBrand: paymentMethod.card.brand,
        enabled: true,
      },
      create: {
        leaseId: targetLeaseId,
        stripeCustomerId:
          typeof setupIntent.customer === "string"
            ? setupIntent.customer
            : setupIntent.customer?.id || "",
        stripePaymentMethodId: paymentMethod.id,
        cardLast4: paymentMethod.card.last4,
        cardBrand: paymentMethod.card.brand,
        enabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      card: {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      },
    });
  } catch (error) {
    console.error("POST /api/payments/methods/confirm error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment method" },
      { status: 500 }
    );
  }
}
