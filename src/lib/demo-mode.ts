/**
 * ParkPGH Demo Mode
 *
 * When DEMO_MODE=true, external API calls (Stripe, Twilio, Resend) are skipped.
 * Instead, actions are logged to console and simulated responses are returned.
 * This allows full flow testing without any API keys.
 */

export const isDemoMode = process.env.DEMO_MODE === "true";

export function demoLog(service: string, action: string, data?: unknown) {
  if (!isDemoMode) return;
  console.log(
    `\n🎭 [DEMO] ${service}.${action}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

/**
 * Wraps an async function so that in demo mode, it skips the real call
 * and returns a mock result instead.
 */
export function withDemoFallback<T>(
  realFn: () => Promise<T>,
  mockResult: T,
  service: string,
  action: string,
  logData?: unknown
): Promise<T> {
  if (isDemoMode) {
    demoLog(service, action, logData);
    return Promise.resolve(mockResult);
  }
  return realFn();
}
