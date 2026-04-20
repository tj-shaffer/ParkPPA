/**
 * Stripe Server Client — ParkPGH
 *
 * Initializes Stripe with the secret key and provides helpers
 * for creating PaymentIntents.
 */

import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
}

export const stripe = new Stripe(stripeSecretKey, {
  typescript: true,
});

/**
 * Create a PaymentIntent for a specific amount.
 * @param amountCents - Amount in cents (e.g., 17500 for $175.00)
 * @param metadata - Additional metadata to attach to the payment
 */
export async function createPaymentIntent(
  amountCents: number,
  metadata: Record<string, string> = {}
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    metadata,
    payment_method_types: ["card"],
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Get an existing Stripe Customer by email, or create a new one.
 */
export async function getOrCreateCustomer(email: string, name: string) {
  const existingCustomers = await stripe.customers.list({ email, limit: 1 });
  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }
  return await stripe.customers.create({ email, name });
}

/**
 * Create a SetupIntent to save a card for future use.
 * @param customerId - The Stripe Customer ID
 * @param metadata - Additional metadata
 */
export async function createSetupIntent(
  customerId: string,
  metadata: Record<string, string> = {}
) {
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    metadata,
    payment_method_types: ["card"],
  });

  return {
    clientSecret: setupIntent.client_secret,
    setupIntentId: setupIntent.id,
  };
}

export default stripe;
