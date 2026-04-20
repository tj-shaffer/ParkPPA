import twilio from "twilio";
import { Resend } from "resend";

export async function sendSMS(to: string, body: string) {
  if (process.env.DEMO_MODE === "true") {
    console.log(`[DEMO MODE] Skip sending SMS to ${to}. Content: ${body}`);
    return { success: true, messageId: "demo_sms_id" };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    throw new Error("Missing Twilio credentials in environment variables.");
  }

  console.log(`📱 Sending SMS: from=${fromPhone} → to=${to}`);

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      body,
      from: fromPhone,
      to,
    });
    console.log(`✅ SMS sent! SID=${message.sid}, Status=${message.status}, To=${message.to}`);
    return { success: true, messageId: message.sid };
  } catch (error: any) {
    console.error("❌ Twilio SMS Error:", error.code, error.message || error);
    return { success: false, error: error.message };
  }
}

// ─── Local SSL Bypass for Development Only ───────────────────────────────────
// If testing locally (not in production), safely disable strict SSL verification
// so the Node TLS socket doesn't block outgoing API requests to Resend.
if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.DEMO_MODE === "true") {
    console.log(`[DEMO MODE] Skip sending Email to ${to}. Subject: ${subject}`);
    return { success: true, messageId: "demo_email_id" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "ParkPGH <onboarding@resend.dev>"; 

  if (!apiKey) {
    throw new Error("Missing Resend credentials in environment variables.");
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("❌ Resend API Error:", error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ Email sent via Resend! ID=${data?.id}, To=${to}`);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error("❌ Unexpected Email Error:", error.message || error);
    return { success: false, error: error.message };
  }
}

