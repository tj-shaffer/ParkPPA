"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons/Icon";
import styles from "./payments.module.css";
import PaymentModal from "@/components/PaymentModal";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  amount: string;
  dueDate: string;
  paidAt: string | null;
  status: string;
  lease: {
    garage: { name: string };
  };
}

type FilterType = "all" | "PAID" | "PENDING" | "PAST_DUE";

function statusIcon(status: string): IconName {
  switch (status) {
    case "PAID": return "check-circle";
    case "PENDING": return "calendar";
    case "PAST_DUE": return "alert-triangle";
    default: return "circle-dot";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "PAID": return "paid";
    case "PENDING": return "pending";
    case "PAST_DUE": return "overdue";
    default: return "pending";
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [payingPayment, setPayingPayment] = useState<Payment | null>(null);

  async function fetchPayments() {
    try {
      const res = await fetch("/api/payments");
      if (res.ok) {
        setPayments(await res.json());
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments =
    filter === "all"
      ? payments
      : payments.filter((p) => p.status === filter);

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalOwed = payments
    .filter((p) => p.status === "PAST_DUE" || p.status === "PENDING")
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "PENDING", label: "Upcoming" },
    { key: "PAST_DUE", label: "Past Due" },
    { key: "PAID", label: "Paid" },
  ];

  if (loading) {
    return (
      <div className={styles.payments}>
        <div className="page-header">
          <h1>Payments</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.payments}>
      {/* Header */}
      <div className="page-header">
        <h1>Payments</h1>
        <p>Your payment history and upcoming charges</p>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryRow}>
        <div className={cn("card", styles.summaryCard)}>
          <div className={styles.summaryLabel}>Total Owed</div>
          <div className={cn(styles.summaryValue, styles.owed)}>
            {formatCurrency(totalOwed)}
          </div>
        </div>
        <div className={cn("card", styles.summaryCard)}>
          <div className={styles.summaryLabel}>Total Paid</div>
          <div className={cn(styles.summaryValue, styles.paid)}>
            {formatCurrency(totalPaid)}
          </div>
        </div>
      </div>

      {/* Payment Method Quick Link */}
      <Link
        href="/settings#payment-method"
        className="card card-interactive"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "var(--space-3) var(--space-4)",
          marginBottom: "var(--space-4)",
          textDecoration: "none",
        }}
        id="link-manage-payment-methods"
      >
        <div style={{
          width: 36,
          height: 36,
          borderRadius: "var(--radius-md)",
          background: "var(--color-info-light)",
          color: "var(--color-info-dark)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name="credit-card" size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ppa-navy)" }}>
            Payment Methods
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ppa-gray-400)" }}>
            Manage saved cards &amp; Auto-Pay
          </div>
        </div>
        <Icon name="chevron-right" size={16} style={{ color: "var(--ppa-gray-300)" }} />
      </Link>

      {/* Filter Tabs */}
      <div className={styles.filterRow}>
        {filters.map((f) => (
          <button
            key={f.key}
            className={cn(styles.filterBtn, filter === f.key && styles.filterActive)}
            onClick={() => setFilter(f.key)}
            id={`filter-${f.key}`}
          >
            {f.label}
            {f.key === "PAST_DUE" && (
              <span className={styles.filterCount}>
                {payments.filter((p) => p.status === "PAST_DUE").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Payment List */}
      <div className={cn("card", styles.paymentList)}>
        {filteredPayments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="credit-card" size={28} /></div>
            <div className="empty-state-title">No payments found</div>
            <div className="empty-state-desc">No payments match this filter.</div>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div className="payment-item" key={payment.id}>
              <div className={cn("payment-icon", statusClass(payment.status))}>
                <Icon name={statusIcon(payment.status)} size={18} />
              </div>
              <div className="payment-details">
                <div className="payment-title">
                  Monthly Lease — {payment.lease?.garage?.name || "Garage"}
                </div>
                <div className="payment-subtitle">
                  {payment.status === "PAID" && payment.paidAt
                    ? `Paid ${formatDate(payment.paidAt, "short")}`
                    : payment.status === "PAST_DUE"
                    ? `Due ${formatDate(payment.dueDate, "short")} — overdue`
                    : `Due ${formatDate(payment.dueDate, "relative")}`}
                </div>
              </div>
              <div className={styles.paymentRight}>
                <div className={cn("payment-amount", payment.status === "PAID" && "credit")}>
                  {formatCurrency(payment.amount)}
                </div>
                {(payment.status === "PAST_DUE" || payment.status === "PENDING") && (
                  <button
                    className="btn btn-primary btn-sm"
                    id={`pay-${payment.id}`}
                    onClick={() => setPayingPayment(payment)}
                  >
                    Pay
                  </button>
                )}
                {payment.status === "PAID" && (
                  <button className="btn btn-ghost btn-sm">Receipt</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stripe Payment Modal */}
      {payingPayment && (
        <PaymentModal
          paymentId={payingPayment.id}
          amount={parseFloat(payingPayment.amount)}
          garageName={payingPayment.lease?.garage?.name || "Garage"}
          onClose={() => setPayingPayment(null)}
          onSuccess={() => {
            setPayingPayment(null);
            // Refresh payments to show updated status
            fetchPayments();
          }}
        />
      )}
    </div>
  );
}
