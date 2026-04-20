/**
 * Notification Triggers — ParkPGH
 *
 * These functions fire real SMS notifications after key events.
 * Each creates a Notification record in the DB for audit trail.
 */

import prisma from "@/lib/db";
import { sendSMS } from "@/lib/notifications";

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

interface PaymentInfo {
  id: string;
  amount: { toString(): string } | string;
  leaseId: string;
  lease: {
    garage: { name: string };
  };
}

/**
 * Send a payment receipt after successful Stripe payment.
 */
export async function onPaymentSuccess(payment: PaymentInfo, user: UserInfo) {
  if (!user.phone) {
    console.log(`Skip SMS receipt — user ${user.id} has no phone`);
    return;
  }

  const amount = typeof payment.amount === "string"
    ? parseFloat(payment.amount)
    : parseFloat(payment.amount.toString());

  const garageName = payment.lease?.garage?.name || "your garage";
  const message = `✅ ParkPGH — Payment received! $${amount.toFixed(2)} for ${garageName}. Thank you!`;

  const result = await sendSMS(user.phone, message);

  await prisma.notification.create({
    data: {
      userId: user.id,
      leaseId: payment.leaseId,
      paymentId: payment.id,
      type: "PAYMENT_CONFIRM",
      channel: "SMS",
      content: message,
      status: result.success ? "SENT" : "FAILED",
      sentAt: result.success ? new Date() : null,
    },
  });

  console.log(`📱 Payment receipt ${result.success ? "sent" : "FAILED"} to ${user.firstName}`);
}

/**
 * Send a past-due reminder to a specific user.
 */
export async function onPaymentPastDue(
  payment: PaymentInfo,
  user: UserInfo
) {
  if (!user.phone) return;

  const amount = typeof payment.amount === "string"
    ? parseFloat(payment.amount)
    : parseFloat(payment.amount.toString());

  const garageName = payment.lease?.garage?.name || "your garage";
  const message = `⚠️ ParkPGH — Your $${amount.toFixed(2)} payment for ${garageName} is past due. Please pay now to avoid service interruption.`;

  const result = await sendSMS(user.phone, message);

  await prisma.notification.create({
    data: {
      userId: user.id,
      leaseId: payment.leaseId,
      paymentId: payment.id,
      type: "PAST_DUE",
      channel: "SMS",
      content: message,
      status: result.success ? "SENT" : "FAILED",
      sentAt: result.success ? new Date() : null,
    },
  });
}

/**
 * Send a welcome notification when a new lease is activated.
 */
export async function onWelcome(
  user: UserInfo,
  lease: { id: string; garage: { name: string } }
) {
  if (!user.phone) return;

  const message = `Welcome to ParkPGH! 🚗 Your lease at ${lease.garage.name} is now active. Manage your account at ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`;

  const result = await sendSMS(user.phone, message);

  await prisma.notification.create({
    data: {
      userId: user.id,
      leaseId: lease.id,
      type: "WELCOME",
      channel: "SMS",
      content: message,
      status: result.success ? "SENT" : "FAILED",
      sentAt: result.success ? new Date() : null,
    },
  });
}
