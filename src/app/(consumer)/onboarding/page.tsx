"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import styles from "./onboarding.module.css";

function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function rawDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = rawDigits(e.target.value);
    if (digits.length <= 10) {
      setPhone(formatPhoneDisplay(digits));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || rawDigits(phone).length !== 10) {
      setError("Please complete all fields with a valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: `+1${rawDigits(phone)}`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile");
      }

      // Profile complete! Let's go to the dashboard.
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.onboardingPage}>
      <div className={styles.bg} />
      <div className={styles.card}>
        <div className={styles.logoIcon}>
          <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#1B2A4A" />
            <text x="20" y="26" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="16">P</text>
          </svg>
        </div>

        <h1 className={styles.title}>Complete your profile</h1>
        <p className={styles.subtitle}>
          Just a few details to finalize your account before you secure your spot.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className="input-group">
              <label className="input-label" htmlFor="first-name">First Name</label>
              <input
                id="first-name"
                type="text"
                className="input"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="last-name">Last Name</label>
              <input
                id="last-name"
                type="text"
                className="input"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="phone-number">Mobile Number</label>
            <p className="text-muted" style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-2)" }}>
              Used for important SMS alerts like parking validations and payments.
            </p>
            <div className={styles.phoneInputWrap}>
              <span className={styles.phonePrefix}>+1</span>
              <input
                id="phone-number"
                type="tel"
                className={cn("input", styles.phoneInput)}
                placeholder="(412) 555-0142"
                value={phone}
                onChange={handlePhoneChange}
              />
            </div>
          </div>

          {error && <div className="input-error-text">{error}</div>}

          <button
            type="submit"
            className={cn("btn btn-primary btn-lg btn-full", isSubmitting && styles.loadingBtn)}
            disabled={!firstName || !lastName || rawDigits(phone).length !== 10 || isSubmitting}
            style={{ marginTop: "var(--space-2)" }}
          >
            {isSubmitting ? <span className={styles.spinner} /> : "Continue to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
