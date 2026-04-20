"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, cn, occupancyPercent } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import AutoPayModal from "@/components/AutoPayModal";
import styles from "./dashboard.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Garage {
  id: string;
  name: string;
  address: string;
  totalSpaces: number;
  leasedSpaces: number;
}

interface AutoPay {
  enabled: boolean;
  cardLast4: string | null;
  cardBrand: string | null;
}

interface Payment {
  id: string;
  amount: string;
  dueDate: string;
  paidAt: string | null;
  status: string;
}

interface Lease {
  id: string;
  leaseNumber: string;
  spotNumber: string | null;
  type: string;
  monthlyRate: string;
  isResident: boolean;
  status: string;
  startDate: string;
  autoRenew: boolean;
  garage: Garage;
  autoPay: AutoPay | null;
  payments: Payment[];
}

// ─── Status Helpers ──────────────────────────────────────────────────────────

function getStatusConfig(status: string, dueDate?: string) {
  if (status === "PENDING" && dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 5 && diffDays >= 0)
      return { label: "Due Soon", color: "warning", icon: "clock" as const };
  }

  switch (status) {
    case "PAID":
      return { label: "Paid", color: "success", icon: "check-circle" as const };
    case "PENDING":
      return { label: "Upcoming", color: "info", icon: "calendar" as const };
    case "PAST_DUE":
      return { label: "Past Due", color: "danger", icon: "alert-triangle" as const };
    case "ACTIVE":
      return { label: "Active", color: "success", icon: "check-circle" as const };
    default:
      return { label: status, color: "neutral", icon: "circle-dot" as const };
  }
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, leasesRes] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/leases"),
        ]);

        if (userRes.ok) {
          setUser(await userRes.json());
        }

        if (leasesRes.ok) {
          const leases = await leasesRes.json();
          if (leases.length > 0) {
            setLease(leases[0]); // Primary lease
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={cn(styles.dashboard, styles.visible)}>
        <div className="page-header">
          <p className={styles.greeting}>Loading...</p>
          <h1>ParkPGH</h1>
        </div>
        <div className={styles.content}>
          <div className="card" style={{ height: 160 }} />
          <div className="card" style={{ height: 200 }} />
        </div>
      </div>
    );
  }

  // No lease or not logged in
  if (!user || !lease) {
    return (
      <div className={cn(styles.dashboard, styles.visible)}>
        <div className="page-header">
          <p className={styles.greeting}>Welcome, {user?.firstName || "Guest"} 👋</p>
          <h1>Your Dashboard</h1>
        </div>
        <div className={styles.content}>
          <div className="card" style={{ textAlign: "center", padding: "var(--space-8) var(--space-4)", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}>
            
            {/* Background design elements to make it look premium */}
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(29, 78, 216, 0.05) 0%, transparent 60%)", zIndex: 0 }} />
            <div style={{ position: "absolute", bottom: -50, left: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(220, 38, 38, 0.05) 0%, transparent 60%)", zIndex: 0 }} />

            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
              <div style={{ marginBottom: "var(--space-2)", color: "var(--ppa-navy)", background: "var(--ppa-gray-100)", padding: "var(--space-4)", borderRadius: "var(--radius-full)" }}>
                <Icon name="map-pin" size={40} />
              </div>
              <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--ppa-navy)", letterSpacing: "-0.02em" }}>Ready to find your spot?</h2>
              <p className="text-muted" style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-4)", maxWidth: "80%", lineHeight: 1.5 }}>
                You don't have an active lease yet. Secure a 24-hour spot at any of our downtown Pittsburgh locations today.
              </p>
              
              <Link href="/apply" className="btn btn-primary btn-lg" style={{ width: "100%", maxWidth: "300px", boxShadow: "var(--shadow-md)" }}>
                Explore Garages & Apply
              </Link>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginTop: "var(--space-2)" }}>
            <div className="card" style={{ padding: "var(--space-4)" }}>
              <div style={{ color: "var(--ppa-crimson)", marginBottom: "var(--space-2)" }}><Icon name="home" size={24} /></div>
              <h4 style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>Downtown Resident?</h4>
              <p className="text-muted" style={{ fontSize: "var(--text-xs)" }}>Apply for discounted rates with proof of residency.</p>
            </div>
            <div className="card" style={{ padding: "var(--space-4)" }}>
              <div style={{ color: "var(--ppa-blue-pale)", marginBottom: "var(--space-2)" }}><Icon name="zap" size={24} /></div>
              <h4 style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>Instant Approval</h4>
              <p className="text-muted" style={{ fontSize: "var(--text-xs)" }}>Standard rates map back instantly upon checkout.</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ─── Compute derived data from the real lease ───────────────────────────────
  const payments = lease.payments || [];
  const nextPayment = payments.find((p) => p.status === "PENDING");
  const pastDuePayments = payments.filter((p) => p.status === "PAST_DUE");
  const recentPayments = payments.slice(0, 3);

  const paymentStatus = nextPayment
    ? getStatusConfig(nextPayment.status, nextPayment.dueDate)
    : { label: "Current", color: "success", icon: "check-circle" as const };
  const leaseStatus = getStatusConfig(lease.status);
  const garage = lease.garage;

  const totalOwed =
    (nextPayment ? parseFloat(nextPayment.amount) : 0) +
    pastDuePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className={cn(styles.dashboard, styles.visible)}>
      {/* Greeting + Header */}
      <div className="page-header">
        <p className={styles.greeting}>Welcome back,</p>
        <h1>{user.firstName} <Icon name="wave" size={28} style={{ display: "inline", verticalAlign: "middle" }} /></h1>
        <p>{garage.name}</p>
      </div>

      <div className={cn("stagger-in", styles.content)}>
        {/* ── Alert: Past Due ────────────────────────────────────────── */}
        {pastDuePayments.length > 0 && (
          <div className={styles.alert}>
            <div className={styles.alertIcon}><Icon name="alert-triangle" size={22} /></div>
            <div className={styles.alertContent}>
              <strong>
                {pastDuePayments.length} payment{pastDuePayments.length > 1 ? "s" : ""} past due
              </strong>
              <span>
                {formatCurrency(pastDuePayments.reduce((s, p) => s + parseFloat(p.amount), 0))}{" "}
                outstanding
              </span>
            </div>
            <Link href="/payments" className="btn btn-sm btn-primary">
              Pay Now
            </Link>
          </div>
        )}

        {/* ── Balance Card ───────────────────────────────────────────── */}
        <div className={cn("card", styles.balanceCard)}>
          <div className={styles.balanceHeader}>
            <span className={styles.balanceLabel}>Current Balance</span>
            <span className={cn("badge", `badge-${paymentStatus.color}`)}>
              <span className="badge-dot" />
              {paymentStatus.label}
            </span>
          </div>
          <div className={styles.balanceAmount}>
            {formatCurrency(totalOwed)}
          </div>
          {nextPayment && (
            <div className={styles.balanceDue}>
              Next payment due {formatDate(nextPayment.dueDate, "relative")}
              <span className={styles.balanceDueDate}>
                {formatDate(nextPayment.dueDate)}
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            {nextPayment && (
              <Link
                href="/payments"
                className="btn btn-primary btn-lg btn-full"
                id="btn-pay-now"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Pay {formatCurrency(nextPayment.amount)}
              </Link>
            )}
            {!lease.autoPay?.enabled && (
              <button className="btn btn-outline btn-full" id="btn-autopay" onClick={() => setShowAutoPayModal(true)}>
                <Icon name="zap" size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Set Up Auto-Pay
              </button>
            )}
          </div>
        </div>

        {/* ── Lease Summary Card ─────────────────────────────────────── */}
        <Link href="/lease" className={cn("card card-interactive", styles.leaseCard)} id="card-lease">
          <div className="card-header">
            <div>
              <div className="card-title">Your Lease</div>
              <div className="card-subtitle">{lease.leaseNumber}</div>
            </div>
            <span className={cn("badge", `badge-${leaseStatus.color}`)}>
              <span className="badge-dot" />
              {leaseStatus.label}
            </span>
          </div>

          <div className={styles.leaseDetails}>
            <div className={styles.leaseDetail}>
              <span className={styles.leaseDetailLabel}>Garage</span>
              <span className={styles.leaseDetailValue}>{garage.name}</span>
            </div>
            <div className={styles.leaseDetail}>
              <span className={styles.leaseDetailLabel}>Spot</span>
              <span className={styles.leaseDetailValue}>{lease.spotNumber || "—"}</span>
            </div>
            <div className={styles.leaseDetail}>
              <span className={styles.leaseDetailLabel}>Type</span>
              <span className={styles.leaseDetailValue}>{lease.type.replace("TWENTY_FOUR_HR", "24HR")}</span>
            </div>
            <div className={styles.leaseDetail}>
              <span className={styles.leaseDetailLabel}>Monthly</span>
              <span className={cn(styles.leaseDetailValue, "mono")}>{formatCurrency(lease.monthlyRate)}</span>
            </div>
          </div>

          {lease.isResident && (
            <div className={styles.residentBadge}><Icon name="home" size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Downtown Resident Discount Applied</div>
          )}

          {lease.autoPay?.enabled && (
            <div className={styles.autoPayBadge}><Icon name="zap" size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Auto-Pay Enabled</div>
          )}

          <div className={styles.cardArrow}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </Link>



        {/* ── Recent Payments ────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Payments</div>
            <Link href="/payments" className="btn btn-ghost btn-sm" id="link-all-payments">
              View All <Icon name="chevron-right" size={14} />
            </Link>
          </div>

          <div className={styles.paymentFeed}>
            {recentPayments.map((payment) => {
              const pStatus = getStatusConfig(payment.status);
              return (
                <div className="payment-item" key={payment.id}>
                  <div className={cn("payment-icon", payment.status === "PAID" ? "paid" : payment.status === "PAST_DUE" ? "overdue" : "pending")}>
                    <Icon name={pStatus.icon} size={18} />
                  </div>
                  <div className="payment-details">
                    <div className="payment-title">Monthly Lease — {formatDate(payment.dueDate, "short")}</div>
                    <div className="payment-subtitle">
                      {payment.paidAt ? `Paid ${formatDate(payment.paidAt, "short")}` : pStatus.label}
                    </div>
                  </div>
                  <div className={cn("payment-amount", payment.status === "PAID" && "credit")}>
                    {formatCurrency(payment.amount)}
                  </div>
                </div>
              );
            })}
            {recentPayments.length === 0 && (
              <p className="text-muted" style={{ textAlign: "center", padding: "var(--space-4)" }}>No payments yet</p>
            )}
          </div>
        </div>

        {/* ── Quick Info ─────────────────────────────────────────────── */}
        <div className={styles.quickInfo}>
          <div className={cn("card", styles.infoCard)}>
            <div className={styles.infoIcon}><Icon name="map-pin" size={24} /></div>
            <div className={styles.infoLabel}>Address</div>
            <div className={styles.infoValue}>{garage.address}</div>
          </div>
          <div className={cn("card", styles.infoCard)}>
            <div className={styles.infoIcon}><Icon name="phone" size={24} /></div>
            <div className={styles.infoLabel}>Support</div>
            <div className={styles.infoValue}>412-560-7275</div>
          </div>
        </div>

        {/* ── New Application CTA ────────────────────────────────────── */}
        <div className="card" style={{ textAlign: "center", padding: "var(--space-6) var(--space-4)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
          <div style={{ marginBottom: "var(--space-1)", color: "var(--ppa-navy)" }}><Icon name="car" size={32} /></div>
          <h3 style={{ fontSize: "var(--text-lg)" }}>Need parking elsewhere?</h3>
          <p className="text-muted" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-2)" }}>
            Secure a spot at another location or apply for the downtown resident discount.
          </p>
          <Link href="/apply" className="btn btn-secondary">
            Apply for a Lease
          </Link>
        </div>
      </div>

      {showAutoPayModal && (
        <AutoPayModal
          leaseId={lease.id}
          garageName={garage.name}
          onClose={() => setShowAutoPayModal(false)}
          onSuccess={() => {
            setShowAutoPayModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
