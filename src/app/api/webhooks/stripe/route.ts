import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import stripe from "@/lib/stripe";
import { onPaymentSuccess } from "@/lib/notification-triggers";

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler — processes payment events.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret && webhookSecret !== "whsec_PASTE_YOUR_KEY_HERE") {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // In dev without webhook secret, parse the body directly
      event = JSON.parse(body);
      console.warn("⚠️ Stripe webhook signature verification skipped (no webhook secret configured)");
    }
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ─── Handle Events ────────────────────────────────────────────────────────
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const paymentId = paymentIntent.metadata?.paymentId;

      if (paymentId) {
        // Update payment record
        const payment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            processorId: paymentIntent.id,
          },
          include: {
            lease: {
              include: { user: true, garage: true },
            },
          },
        });

        console.log(`✅ Payment ${paymentId} marked as PAID via Stripe`);

        // Send receipt notification
        try {
          await onPaymentSuccess(payment, payment.lease.user);
        } catch (err) {
          console.error("Failed to send payment receipt:", err);
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const paymentId = paymentIntent.metadata?.paymentId;

      if (paymentId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "FAILED" },
        });

        console.log(`❌ Payment ${paymentId} FAILED via Stripe`);
      }
      break;
    }

    case "setup_intent.succeeded": {
      const setupIntent = event.data.object;
      const leaseId = setupIntent.metadata?.leaseId;
      const paymentMethodId = typeof setupIntent.payment_method === 'string'
          ? setupIntent.payment_method
          : setupIntent.payment_method?.id;

      if (leaseId && paymentMethodId) {
        // Retrieve card details
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        
        if (paymentMethod.card) {
          await prisma.autoPay.upsert({
            where: { leaseId },
            update: {
              stripePaymentMethodId: paymentMethod.id,
              cardLast4: paymentMethod.card.last4,
              cardBrand: paymentMethod.card.brand,
              enabled: true,
            },
            create: {
              leaseId,
              stripePaymentMethodId: paymentMethod.id,
              cardLast4: paymentMethod.card.last4,
              cardBrand: paymentMethod.card.brand,
              enabled: true,
            }
          });
          console.log(`✅ AutoPay enabled for lease ${leaseId} via Stripe SetupIntent`);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
