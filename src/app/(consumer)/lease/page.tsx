"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import styles from "./lease.module.css";

interface Garage {
  name: string;
  address: string;
  phone: string | null;
  monthlyRate: string;
  residentMonthlyRate: string | null;
}

interface AutoPay {
  enabled: boolean;
  cardLast4: string | null;
  cardBrand: string | null;
}

interface Lease {
  id: string;
  leaseNumber: string;
  spotNumber: string | null;
  type: string;
  monthlyRate: string;
  isResident: boolean;
  residentProofStatus: string;
  status: string;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  notes: string | null;
  garage: Garage;
  autoPay: AutoPay | null;
}

export default function LeasePage() {
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLease() {
      try {
        const res = await fetch("/api/leases");
        if (res.ok) {
          const leases = await res.json();
          if (leases.length > 0) setLease(leases[0]);
        }
      } catch (err) {
        console.error("Failed to load lease:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLease();
  }, []);

  if (loading) {
    return (
      <div className={styles.lease}>
        <div className="page-header">
          <h1>Lease Details</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className={styles.lease}>
        <div className="page-header">
          <h1>Lease Details</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="clipboard" size={28} /></div>
          <h3 className="empty-state-title">No active lease</h3>
          <p className="empty-state-desc">You don&apos;t have an active lease yet.</p>
        </div>
      </div>
    );
  }

  const standardRate = lease.garage.monthlyRate ? parseFloat(lease.garage.monthlyRate) : parseFloat(lease.monthlyRate);
  const currentRate = parseFloat(lease.monthlyRate);
  const savings = standardRate - currentRate;
  const typeName = lease.type === "TWENTY_FOUR_HR" ? "24-Hour Access" : lease.type;

  return (
    <div className={styles.lease}>
      {/* Header */}
      <div className="page-header">
        <div className={styles.headerRow}>
          <div>
            <h1>Lease Details</h1>
            <p>{lease.leaseNumber}</p>
          </div>
          <span className={cn("badge", lease.status === "ACTIVE" ? "badge-success" : "badge-warning")}>
            <span className="badge-dot" />
            {lease.status}
          </span>
        </div>
      </div>

      <div className="stagger-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {/* ── Lease Overview ─────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Lease Overview</div>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Garage</div>
              <div className={styles.detailValue}>{lease.garage.name}</div>
              <div className={styles.detailSub}>{lease.garage.address}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Spot</div>
              <div className={styles.detailValue}>{lease.spotNumber || "—"}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Access Type</div>
              <div className={styles.detailValue}>{typeName}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Monthly Rate</div>
              <div className={cn(styles.detailValue, "mono")}>
                {formatCurrency(currentRate)}
              </div>
              {lease.isResident && savings > 0 && (
                <div className={styles.detailDiscount}>
                  <span className={styles.strikethrough}>{formatCurrency(standardRate)}</span>
                  <span className={styles.savingsBadge}>Save {formatCurrency(savings)}/mo</span>
                </div>
              )}
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Start Date</div>
              <div className={styles.detailValue}>{formatDate(lease.startDate, "long")}</div>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLabel}>Term</div>
              <div className={styles.detailValue}>
                {lease.endDate ? `Ends ${formatDate(lease.endDate, "long")}` : "Month-to-Month"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Resident Discount ──────────────────────────────────────── */}
        {lease.isResident && (
          <div className={cn("card", styles.residentCard)}>
            <div className={styles.residentHeader}>
              <span className={styles.residentIcon}><Icon name="home" size={20} /></span>
              <div>
                <div className={styles.residentTitle}>Downtown Resident Discount</div>
                <div className={styles.residentSub}>
                  {lease.residentProofStatus === "VERIFIED" ? "Verified" : lease.residentProofStatus} • {formatCurrency(savings)} savings per month
                </div>
              </div>
            </div>
            <div className={styles.residentStatus}>
              <span className={cn("badge", lease.residentProofStatus === "VERIFIED" ? "badge-success" : "badge-warning")}>
                <span className="badge-dot" />
                {lease.residentProofStatus}
              </span>
            </div>
          </div>
        )}

        {/* ── Renewal & Auto-Pay ─────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Renewal & Auto-Pay</div>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <div className={styles.toggleLabel}>Auto-Renew</div>
              <div className={styles.toggleDesc}>Automatically renew your lease each month</div>
            </div>
            <button className={cn(styles.toggle, lease.autoRenew && styles.toggleOn)} id="toggle-auto-renew" aria-label="Toggle auto-renew">
              <span className={styles.toggleKnob} />
            </button>
          </div>

          <hr className="divider" />

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <div className={styles.toggleLabel}><Icon name="zap" size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Auto-Pay</div>
              <div className={styles.toggleDesc}>
                {lease.autoPay?.enabled
                  ? `${lease.autoPay.cardBrand || "Card"} ending in •••• ${lease.autoPay.cardLast4 || "????"} — Charged on the 1st`
                  : "Not enrolled"}
              </div>
            </div>
            <button className={cn(styles.toggle, lease.autoPay?.enabled && styles.toggleOn)} id="toggle-auto-pay" aria-label="Toggle auto-pay">
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </div>

        {/* ── Documents ──────────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Documents</div>
          </div>

          {[
            { name: "Lease Agreement", date: lease.startDate, type: "PDF" },
            ...(lease.isResident ? [{ name: "Resident Discount Verification", date: lease.startDate, type: "PDF" }] : []),
          ].map((doc, i) => (
            <div className={styles.docRow} key={i}>
              <div className={styles.docIcon}><Icon name="file-text" size={20} /></div>
              <div className={styles.docInfo}>
                <div className={styles.docName}>{doc.name}</div>
                <div className={styles.docMeta}>{doc.type} • {formatDate(doc.date, "short")}</div>
              </div>
              <button className="btn btn-ghost btn-sm">View</button>
            </div>
          ))}
        </div>

        {/* ── Garage Contact ─────────────────────────────────────────── */}
        <div className={cn("card", styles.contactCard)}>
          <div className="card-title" style={{ marginBottom: "var(--space-3)" }}>Need Help?</div>
          <p style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
            Contact {lease.garage.name} directly or reach PPA support.
          </p>
          <div className={styles.contactActions}>
            <a href={`tel:${lease.garage.phone || "4125607275"}`} className="btn btn-outline" id="btn-call-garage">
              <Icon name="phone" size={16} /> Call Garage
            </a>
            <a href="tel:4125607275" className="btn btn-outline" id="btn-call-ppa">
              <Icon name="phone" size={16} /> PPA Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
