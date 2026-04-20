"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import styles from "./settings.module.css";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  notifyPreference: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifyPref, setNotifyPref] = useState<"EMAIL" | "SMS" | "BOTH">("BOTH");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setNotifyPref(data.notifyPreference);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleNotifyChange = async (pref: "EMAIL" | "SMS" | "BOTH") => {
    setNotifyPref(pref);
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyPreference: pref }),
      });
    } catch (err) {
      console.error("Failed to update preference:", err);
    }
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "..";

  if (loading) {
    return (
      <div className={styles.settings}>
        <div className="page-header">
          <h1>Settings</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.settings}>
      {/* Header */}
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account and preferences</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {/* ── Profile ──────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Profile</div>
            <Link href="/settings/profile" className="btn btn-ghost btn-sm">Edit</Link>
          </div>

          <div className={styles.profileRow}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{user?.firstName} {user?.lastName}</div>
              <div className={styles.profileEmail}>{user?.email}</div>
              <div className={styles.profilePhone}>{user?.phone || "No phone set"}</div>
            </div>
          </div>
        </div>

        {/* ── Notifications ────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Notifications</div>
          </div>

          <div className={styles.prefGroup}>
            <div className={styles.prefLabel}>Preferred Contact Method</div>
            <div className={styles.prefOptions}>
              {(["EMAIL", "SMS", "BOTH"] as const).map((opt) => (
                <button
                  key={opt}
                  className={cn(styles.prefBtn, notifyPref === opt && styles.prefActive)}
                  onClick={() => handleNotifyChange(opt)}
                  id={`pref-${opt.toLowerCase()}`}
                >
                  {opt === "EMAIL" && <><Icon name="mail" size={14} /> Email</>}
                  {opt === "SMS" && <><Icon name="smartphone" size={14} /> SMS</>}
                  {opt === "BOTH" && <><Icon name="mail" size={14} /><Icon name="smartphone" size={14} /> Both</>}
                </button>
              ))}
            </div>
          </div>

          <hr className="divider" />

          <div className={styles.notifyList}>
            {[
              { label: "Payment Reminders", desc: "5 days and 1 day before due date", enabled: true },
              { label: "Payment Confirmations", desc: "When a payment is processed", enabled: true },
              { label: "Past Due Alerts", desc: "When a payment is overdue", enabled: true },
              { label: "Lease Renewal", desc: "30 and 7 days before expiry", enabled: true },
              { label: "Rate Changes", desc: "When your rate changes", enabled: true },
              { label: "Garage Alerts", desc: "Closures, maintenance, etc.", enabled: false },
            ].map((item, i) => (
              <div className={styles.notifyRow} key={i}>
                <div className={styles.notifyInfo}>
                  <div className={styles.notifyLabel}>{item.label}</div>
                  <div className={styles.notifyDesc}>{item.desc}</div>
                </div>
                <button
                  className={cn(styles.toggle, item.enabled && styles.toggleOn)}
                  aria-label={`Toggle ${item.label}`}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Auto-Pay ─────────────────────────────────────────────── */}
        <div className="card" id="payment-method">
          <div className="card-header">
            <div className="card-title">Payment Method</div>
            <button className="btn btn-ghost btn-sm">Change</button>
          </div>

          <div className={styles.paymentMethod}>
            <div className={styles.cardIcon}><Icon name="credit-card" size={24} /></div>
            <div className={styles.cardInfo}>
              <div className={styles.cardBrand}>Visa •••• 4242</div>
              <div className={styles.cardExpiry}>Expires 12/27</div>
            </div>
            <span className="badge badge-success">
              <span className="badge-dot" />
              Active
            </span>
          </div>

          <div className={styles.autoPayNote}>
            <span><Icon name="zap" size={14} /></span>
            Auto-Pay charges your card on the 1st of each month. You&apos;ll get a confirmation receipt via {notifyPref === "BOTH" ? "email & SMS" : notifyPref.toLowerCase()}.
          </div>
        </div>

        {/* ── Appearance ───────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Appearance</div>
          </div>

          <div className={styles.notifyRow}>
            <div className={styles.notifyInfo}>
              <div className={styles.notifyLabel}>Dark Mode</div>
              <div className={styles.notifyDesc}>Use dark theme</div>
            </div>
            <button
              className={cn(styles.toggle, darkMode && styles.toggleOn)}
              onClick={() => {
                setDarkMode(!darkMode);
                document.documentElement.setAttribute("data-theme", !darkMode ? "dark" : "light");
              }}
              aria-label="Toggle dark mode"
              id="toggle-dark-mode"
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </div>

        {/* ── Account Actions ──────────────────────────────────────── */}
        <div className="card">
          <button
            className="btn btn-ghost btn-full"
            style={{ justifyContent: "flex-start", color: "var(--ppa-gray-500)" }}
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            id="btn-sign-out"
          >
            Sign Out
          </button>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p>ParkPGH v1.0.0</p>
          <p>Pittsburgh Parking Authority</p>
          <p>232 Boulevard of the Allies, Pittsburgh, PA 15222</p>
        </div>
      </div>
    </div>
  );
}
