"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import styles from "./login.module.css";

type Step = "email" | "code" | "success";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ─── Resend countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // ─── Send OTP ──────────────────────────────────────────────────────────────
  const sendOtp = useCallback(async (emailAddress?: string) => {
    const target = emailAddress || email;
    if (!target.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send code.");
        setLoading(false);
        return;
      }

      setStep("code");
      setResendTimer(30);
      setCode(["", "", "", "", "", ""]);
      // Focus the first code input after render
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ─── Verify OTP ────────────────────────────────────────────────────────────
  const verifyOtp = useCallback(async (fullCode: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed.");
        setLoading(false);
        // Clear code inputs on failure
        setCode(["", "", "", "", "", ""]);
        setTimeout(() => codeRefs.current[0]?.focus(), 100);
        return;
      }

      setStep("success");
      // Redirect after brief success animation
      setTimeout(() => {
        if (data.isNewUser && data.role !== "ADMIN") {
          router.push("/onboarding");
        } else {
          router.push(data.redirectTo || "/dashboard");
        }
      }, 800);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }, [email, router]);

  // ─── Email form submit ─────────────────────────────────────────────────────
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendOtp();
  };

  // ─── Code input handlers ──────────────────────────────────────────────────
  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");

    // Auto-advance to next input
    if (digit && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        verifyOtp(fullCode);
      }
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      codeRefs.current[5]?.focus();
      verifyOtp(pasted);
    }
  };

  // ─── Email input ───────────────────────────────────────────────────────────
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  return (
    <div className={styles.loginPage}>
      {/* Background gradient */}
      <div className={styles.bg} />

      <div className={styles.loginCard}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#1B2A4A" />
              <text x="20" y="26" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="16">P</text>
            </svg>
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoBrand}>ParkPGH</span>
            <span className={styles.logoSub}>Pittsburgh Parking Authority</span>
          </div>
        </div>

        {/* ── Step 1: Email Address ─────────────────────────────────────── */}
        {step === "email" && (
          <>
            <h1 className={styles.title}>Sign in to your account</h1>
            <p className={styles.subtitle}>
              Enter your email address and we&apos;ll send you a 6-digit code. No password needed.
            </p>

            <form onSubmit={handleEmailSubmit} className={styles.form}>
              <div className="input-group">
                <label htmlFor="login-email" className="input-label">
                  Email Address
                </label>
                <div className={styles.emailInputWrap} style={{position: 'relative'}}>
                  <div style={{position: 'absolute', top: '12px', left: '16px', color: 'var(--ppa-gray-400)'}}>
                    <Icon name="mail" size={20} />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    className={cn("input", error && "input-error")}
                    style={{paddingLeft: '48px'}}
                    placeholder="name@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                {error && <div className="input-error-text">{error}</div>}
              </div>

              <button
                type="submit"
                className={cn("btn btn-primary btn-lg btn-full", loading && styles.loading)}
                disabled={!email.includes("@") || loading}
                id="btn-send-code"
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    Send Code
                  </>
                )}
              </button>
          </form>
          </>
        )}

        {/* ── Step 2: Code Entry ───────────────────────────────────────── */}
        {step === "code" && (
          <>
            <h1 className={styles.title}>Enter your code</h1>
            <p className={styles.subtitle}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>

            <div className={styles.codeForm}>
              <div className={styles.codeInputs} onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={cn(styles.codeDigit, error && styles.codeDigitError)}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    id={`code-digit-${i}`}
                  />
                ))}
              </div>

              {error && <div className="input-error-text" style={{ textAlign: "center" }}>{error}</div>}

              {loading && (
                <div className={styles.verifying}>
                  <span className={styles.spinner} />
                  <span>Verifying...</span>
                </div>
              )}

              <div className={styles.codeActions}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setStep("email");
                    setCode(["", "", "", "", "", ""]);
                    setError("");
                  }}
                >
                  ← Change email
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={resendTimer > 0}
                  onClick={() => sendOtp()}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Step 3: Success ──────────────────────────────────────────── */}
        {step === "success" && (
          <div className={styles.sentState}>
            <div className={styles.sentIcon}><Icon name="check-circle" size={48} style={{ color: "var(--color-success)" }} /></div>
            <h1 className={styles.title}>You&apos;re in!</h1>
            <p className={styles.subtitle}>Redirecting to your dashboard...</p>
            <div className={styles.verifying}>
              <span className={styles.spinner} />
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <a href="https://pittsburghparking.com" target="_blank" rel="noopener noreferrer">
            pittsburghparking.com
          </a>
          <span>•</span>
          <span>(412) 560-7275</span>
        </div>
      </div>
    </div>
  );
}
