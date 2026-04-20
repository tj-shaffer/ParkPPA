"use server";

import { destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Sign out — destroy session cookie and redirect to login.
 */
export async function signOut() {
  await destroySession();
  redirect("/login");
}
