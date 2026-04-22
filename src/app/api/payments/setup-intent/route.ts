import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getOrCreateCustomer, createSetupIntent } from "@/lib/stripe";

/**
 * POST /api/payments/setup-intent
 * Create a Stripe SetupIntent for the current user's lease.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { leases: true },
    });

    if (!user || user.leases.length === 0) {
      return NextResponse.json({ error: "User or active lease not found" }, { status: 404 });
    }

    // For now assuming the user is setting up AutoPay for their first/primary lease.
    // If they have multiple, the client should pass leaseId.
    const body = await request.json().catch(() => ({}));
    const leaseId = body.leaseId || user.leases[0].id;
    
    // Validate lease belongs to user
    const lease = user.leases.find(l => l.id === leaseId);
    if (!lease) {
      return NextResponse.json({ error: "Unauthorized for this lease" }, { status: 403 });
    }

    // Check if AutoPay already exists
    let autoPay = await prisma.autoPay.findUnique({
      where: { leaseId },
    });

    // 1. Get or create Stripe Customer
    const customerName = `${user.firstName} ${user.lastName}`;
    const stripeCustomer = await getOrCreateCustomer(user.email, customerName);

    // 2. Upsert AutoPay with Customer ID (but enabled: false until setup completes)
    if (!autoPay) {
      autoPay = await prisma.autoPay.create({
        data: {
          leaseId,
          stripeCustomerId: stripeCustomer.id,
          enabled: false,
        },
      });
    } else if (!autoPay.stripeCustomerId) {
       autoPay = await prisma.autoPay.update({
         where: { leaseId },
         data: { stripeCustomerId: stripeCustomer.id },
       });
    }

    // 3. Create SetupIntent
    const { clientSecret } = await createSetupIntent(stripeCustomer.id, {
      userId: user.id,
      leaseId: lease.id,
    });

    return NextResponse.json({ clientSecret });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/payments/setup-intent error:", message, error);
    return NextResponse.json(
      { error: `Failed to initialize card setup: ${message}` },
      { status: 500 }
    );
  }
}
