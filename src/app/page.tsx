import { redirect } from "next/navigation";

/**
 * Root page — redirects to dashboard (consumer) or admin.
 * In a full implementation, this would check the session and route accordingly.
 * For now, we redirect to the consumer dashboard.
 */
export default function HomePage() {
  redirect("/dashboard");
}
