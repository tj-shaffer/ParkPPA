"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import AutoPayModal from "@/components/AutoPayModal";
import styles from "./settings.module.css";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  notifyPreference: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifyPref, setNotifyPref] = useState<"EMAIL" | "SMS" | "BOTH">("BOTH");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  // Fetch the user's first lease ID for the AutoPayModal
  const [primaryLeaseId, setPrimaryLeaseId] = useState<string | null>(null);
  const [primaryGarageName, setPrimaryGarageName] = useState("Your Garage");

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, methodsRes, leasesRes] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/payments/methods"),
          fetch("/api/leases"),
        ]);

        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data);
          setNotifyPref(data.notifyPreference);
        }

        if (methodsRes.ok) {
          const data = await methodsRes.json();
          setPaymentMethods(data.methods || []);
        }

        if (leasesRes.ok) {
          const leases = await leasesRes.json();
          if (leases.length > 0) {
            setPrimaryLeaseId(leases[0].id);
            setPrimaryGarageName(leases[0].garage?.name || "Your Garage");
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
        setLoadingMethods(false);
      }
    }
    fetchData();
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

  const handleRemoveCard = async (paymentMethodId: string) => {
    if (removingId) return;
    setRemovingId(paymentMethodId);

    try {
      const res = await fetch("/api/payments/methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (res.ok) {
        setPaymentMethods((prev) => prev.filter((m) => m.id !== paymentMethodId));
      }
    } catch (err) {
      console.error("Failed to remove card:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const refreshPaymentMethods = async () => {
    try {
      const res = await fetch("/api/payments/methods");
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.methods || []);
      }
    } catch (err) {
      console.error("Failed to refresh methods:", err);
    }
  };

  const formatBrand = (brand: string) => {
    const brands: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "Amex",
      discover: "Discover",
      diners: "Diners Club",
      jcb: "JCB",
      unionpay: "UnionPay",
    };
    return brands[brand.toLowerCase()] || brand;
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
        {/* Profile */}
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

        {/* Notifications */}
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

        {/* Payment Methods — Real Stripe Data */}
        <div className="card" id="payment-method">
          <div className="card-header">
            <div className="card-title">Payment Methods</div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowAddCardModal(true)}
              id="btn-add-card"
            >
              Add Card
            </button>
          </div>

          {loadingMethods ? (
            <p className="text-muted" style={{ fontSize: "var(--text-sm)", textAlign: "center", padding: "var(--space-4)" }}>
              Loading payment methods...
            </p>
          ) : paymentMethods.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--space-6) var(--space-4)" }}>
              <div style={{ color: "var(--ppa-gray-300)", marginBottom: "var(--space-3)" }}>
                <Icon name="credit-card" size={32} />
              </div>
              <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ppa-navy)", marginBottom: "var(--space-1)" }}>
                No cards on file
              </p>
              <p className="text-muted" style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-4)" }}>
                Add a card to enable payments and Auto-Pay.
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddCardModal(true)}
              >
                <Icon name="credit-card" size={14} /> Add Payment Method
              </button>
            </div>
          ) : (
            <>
              {paymentMethods.map((method) => (
                <div className={styles.paymentMethod} key={method.id}>
                  <div className={styles.cardIcon}><Icon name="credit-card" size={24} /></div>
                  <div className={styles.cardInfo}>
                    <div className={styles.cardBrand}>
                      {formatBrand(method.brand)} •••• {method.last4}
                    </div>
                    <div className={styles.cardExpiry}>
                      Expires {String(method.expMonth).padStart(2, "0")}/{String(method.expYear).slice(-2)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    {method.isDefault && (
                      <span className="badge badge-success">
                        <span className="badge-dot" />
                        Auto-Pay
                      </span>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--ppa-gray-400)" }}
                      onClick={() => handleRemoveCard(method.id)}
                      disabled={removingId === method.id}
                      aria-label={`Remove ${formatBrand(method.brand)} card`}
                    >
                      {removingId === method.id ? "..." : <Icon name="x" size={14} />}
                    </button>
                  </div>
                </div>
              ))}

              <div className={styles.autoPayNote}>
                <span><Icon name="zap" size={14} /></span>
                Auto-Pay charges your card on the 1st of each month. You&apos;ll get a confirmation receipt via {notifyPref === "BOTH" ? "email & SMS" : notifyPref.toLowerCase()}.
              </div>
            </>
          )}
        </div>

        {/* Appearance */}
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

        {/* Account Actions */}
        <div className="card">
          <button
            className="btn btn-ghost btn-full"
            style={{ justifyContent: "flex-start", color: "var(--ppa-gray-500)" }}
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/";
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

      {/* Add Card Modal — reuses AutoPayModal for Stripe SetupIntent */}
      {showAddCardModal && primaryLeaseId && (
        <AutoPayModal
          leaseId={primaryLeaseId}
          garageName={primaryGarageName}
          onClose={() => setShowAddCardModal(false)}
          onSuccess={() => {
            setShowAddCardModal(false);
            refreshPaymentMethods();
          }}
        />
      )}

      {/* If no lease exists, show a message instead of the modal */}
      {showAddCardModal && !primaryLeaseId && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: "var(--z-modal)" as string, padding: "var(--space-4)",
          }}
          onClick={() => setShowAddCardModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: 400, textAlign: "center", padding: "var(--space-8) var(--space-6)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: "var(--space-3)", color: "var(--ppa-gray-300)" }}>
              <Icon name="credit-card" size={40} />
            </div>
            <h3 style={{ marginBottom: "var(--space-2)" }}>No Active Lease</h3>
            <p className="text-muted" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
              You need an active lease before you can add a payment method. Apply for a garage lease first.
            </p>
            <button className="btn btn-primary" onClick={() => setShowAddCardModal(false)}>
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
