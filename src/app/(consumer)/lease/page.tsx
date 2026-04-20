"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import AutoPayModal from "@/components/AutoPayModal";
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
  const [togglingRenew, setTogglingRenew] = useState(false);
  const [togglingAutoPay, setTogglingAutoPay] = useState(false);
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);

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

  useEffect(() => {
    fetchLease();
  }, []);

  // ─── Toggle Auto-Renew ──────────────────────────────────────────────────────
  const handleToggleRenew = async () => {
    if (!lease || togglingRenew) return;
    setTogglingRenew(true);

    // Optimistic update
    const newValue = !lease.autoRenew;
    setLease({ ...lease, autoRenew: newValue });

    try {
      const res = await fetch(`/api/leases/${lease.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoRenew: newValue }),
      });

      if (!res.ok) {
        // Revert on failure
        setLease({ ...lease, autoRenew: !newValue });
        console.error("Failed to toggle auto-renew");
      }
    } catch {
      setLease({ ...lease, autoRenew: !newValue });
    } finally {
      setTogglingRenew(false);
    }
  };

  // ─── Toggle Auto-Pay ────────────────────────────────────────────────────────
  const handleToggleAutoPay = async () => {
    if (!lease || togglingAutoPay) return;

    const currentlyEnabled = lease.autoPay?.enabled ?? false;

    if (!currentlyEnabled) {
      // Enabling: check if they have a saved payment method
      if (!lease.autoPay?.cardLast4) {
        // No card on file — open the enrollment modal
        setShowAutoPayModal(true);
        return;
      }

      // Card exists but autopay disabled — re-enable
      setTogglingAutoPay(true);
      setLease({
        ...lease,
        autoPay: { ...lease.autoPay!, enabled: true },
      });

      try {
        const res = await fetch(`/api/leases/${lease.id}/autopay`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: true }),
        });

        if (!res.ok) {
          const data = await res.json();
          if (data.code === "NO_PAYMENT_METHOD") {
            // Open modal instead
            setLease({
              ...lease,
              autoPay: { ...lease.autoPay!, enabled: false },
            });
            setShowAutoPayModal(true);
          } else {
            setLease({
              ...lease,
              autoPay: { ...lease.autoPay!, enabled: false },
            });
          }
        }
      } catch {
        setLease({
          ...lease,
          autoPay: { ...lease.autoPay!, enabled: false },
        });
      } finally {
        setTogglingAutoPay(false);
      }
    } else {
      // Disabling
      setTogglingAutoPay(true);
      setLease({
        ...lease,
        autoPay: { ...lease.autoPay!, enabled: false },
      });

      try {
        const res = await fetch(`/api/leases/${lease.id}/autopay`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: false }),
        });

        if (!res.ok) {
          setLease({
            ...lease,
            autoPay: { ...lease.autoPay!, enabled: true },
          });
        }
      } catch {
        setLease({
          ...lease,
          autoPay: { ...lease.autoPay!, enabled: true },
        });
      } finally {
        setTogglingAutoPay(false);
      }
    }
  };

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
          <span className={cn("badge", lease.status === "ACTIVE" ? "badge-success" : lease.status === "PENDING" ? "badge-warning" : "badge-neutral")}>
            <span className="badge-dot" />
            {lease.status}
          </span>
        </div>
      </div>

      <div className="stagger-in" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {/* Lease Overview */}
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

        {/* Resident Discount */}
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

        {/* Renewal & Auto-Pay */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Renewal & Auto-Pay</div>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <div className={styles.toggleLabel}>Auto-Renew</div>
              <div className={styles.toggleDesc}>Automatically renew your lease each month</div>
            </div>
            <button
              className={cn(styles.toggle, lease.autoRenew && styles.toggleOn)}
              id="toggle-auto-renew"
              aria-label="Toggle auto-renew"
              onClick={handleToggleRenew}
              disabled={togglingRenew}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          <hr className="divider" />

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <div className={styles.toggleLabel}><Icon name="zap" size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Auto-Pay</div>
              <div className={styles.toggleDesc}>
                {lease.autoPay?.enabled
                  ? `${lease.autoPay.cardBrand || "Card"} ending in ${lease.autoPay.cardLast4 || "????"} — Charged on the 1st`
                  : lease.autoPay?.cardLast4
                  ? `Card on file (${lease.autoPay.cardBrand || "Card"} ••${lease.autoPay.cardLast4}) — Currently disabled`
                  : "Not enrolled — add a payment method to enable"}
              </div>
            </div>
            <button
              className={cn(styles.toggle, lease.autoPay?.enabled && styles.toggleOn)}
              id="toggle-auto-pay"
              aria-label="Toggle auto-pay"
              onClick={handleToggleAutoPay}
              disabled={togglingAutoPay}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </div>

        {/* Documents */}
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

        {/* Garage Contact */}
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

      {/* Auto-Pay Enrollment Modal */}
      {showAutoPayModal && (
        <AutoPayModal
          leaseId={lease.id}
          garageName={lease.garage.name}
          onClose={() => setShowAutoPayModal(false)}
          onSuccess={() => {
            setShowAutoPayModal(false);
            setLoading(true);
            fetchLease();
          }}
        />
      )}
    </div>
  );
}
