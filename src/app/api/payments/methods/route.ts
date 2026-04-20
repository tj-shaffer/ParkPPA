import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getOrCreateCustomer } from "@/lib/stripe";
import stripe from "@/lib/stripe";

/**
 * GET /api/payments/methods
 * List saved payment methods for the current user's Stripe Customer.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find if user has a Stripe Customer via any AutoPay record
    const autoPay = await prisma.autoPay.findFirst({
      where: { lease: { userId: session.userId } },
    });

    if (!autoPay?.stripeCustomerId) {
      return NextResponse.json({ methods: [], hasCustomer: false });
    }

    // Fetch payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: autoPay.stripeCustomerId,
      type: "card",
    });

    const methods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand || "unknown",
      last4: pm.card?.last4 || "????",
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.id === autoPay.stripePaymentMethodId,
    }));

    return NextResponse.json({
      methods,
      hasCustomer: true,
      customerId: autoPay.stripeCustomerId,
    });
  } catch (error) {
    console.error("GET /api/payments/methods error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payments/methods
 * Detach a payment method from the user's Stripe Customer.
 * Body: { paymentMethodId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "paymentMethodId is required" },
        { status: 400 }
      );
    }

    // Verify the payment method belongs to this user's Stripe Customer
    const autoPay = await prisma.autoPay.findFirst({
      where: { lease: { userId: session.userId } },
    });

    if (!autoPay?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No payment methods on file" },
        { status: 404 }
      );
    }

    // Detach from Stripe
    await stripe.paymentMethods.detach(paymentMethodId);

    // If this was the AutoPay card, disable AutoPay
    if (autoPay.stripePaymentMethodId === paymentMethodId) {
      await prisma.autoPay.update({
        where: { id: autoPay.id },
        data: {
          stripePaymentMethodId: null,
          cardLast4: null,
          cardBrand: null,
          enabled: false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/payments/methods error:", error);
    return NextResponse.json(
      { error: "Failed to remove payment method" },
      { status: 500 }
    );
  }
}
