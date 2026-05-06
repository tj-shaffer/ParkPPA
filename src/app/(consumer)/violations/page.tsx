"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import styles from "./violations.module.css";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

interface Violation {
  id: string;
  citationNumber: string;
  licensePlate: string;
  state: string;
  violationDate: string;
  location: string;
  violationType: string;
  fineAmount: string;
  status: string;
  dueDate: string;
}

export default function ViolationsPage() {
  const [plate, setPlate] = useState("");
  const [state, setState] = useState("PA");
  const [violations, setViolations] = useState<Violation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!plate.trim()) {
      setError("Please enter a license plate number.");
      return;
    }
    setLoading(true);
    setError("");
    setViolations(null);
    try {
      const res = await fetch(`/api/violations?plate=${encodeURIComponent(plate)}&state=${state}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setViolations(data.violations);
        setSearched(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const unpaid = violations?.filter((v) => v.status === "UNPAID") || [];
  const paid = violations?.filter((v) => v.status === "PAID") || [];
  const totalOwed = unpaid.reduce((sum, v) => sum + parseFloat(v.fineAmount), 0);

  return (
    <div className={styles.page}>
      <div className="page-header">
        <p className={styles.subtitle}>Pittsburgh Parking Authority</p>
        <h1>Violation Lookup</h1>
      </div>
      <div className={cn("stagger-in", styles.content)}>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Search by License Plate</div>
          </div>
          <p className="text-muted" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
            Enter your license plate to view any outstanding parking violations.
          </p>
          <div className={styles.searchRow}>
            <select value={state} onChange={(e) => setState(e.target.value)} className={styles.stateSelect}>
              {US_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <input
              type="text"
              placeholder="e.g. ABC1234"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className={styles.plateInput}
              maxLength={10}
            />
          </div>
          {error && (
            <p style={{ color: "var(--ppa-crimson)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
              {error}
            </p>
          )}
          <button
            className="btn btn-primary btn-lg btn-full"
            style={{ marginTop: "var(--space-4)" }}
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "Searching..." : "Search Violations"}
          </button>
        </div>

        {searched && violations !== null && (
          <>
            <div className={cn("card", styles.summaryCard)}>
              <div className={styles.summaryHeader}>
                <div>
                  <div className={styles.summaryLabel}>Plate: {state} · {plate}</div>
                  <div className={styles.summaryCount}>
                    {violations.length === 0
                      ? "No violations found"
                      : `${violations.length} violation${violations.length > 1 ? "s" : ""} found`}
                  </div>
                </div>
                {unpaid.length > 0 && (
                  <span className="badge badge-danger"><span className="badge-dot" />{unpaid.length} Unpaid</span>
                )}
                {violations.length > 0 && unpaid.length === 0 && (
                  <span className="badge badge-success"><span className="badge-dot" />All Clear</span>
                )}
              </div>
              {unpaid.length > 0 && (
                <div className={styles.totalOwed}>
                  <span>Total Amount Due</span>
                  <span className={styles.totalAmount}>{formatCurrency(totalOwed)}</span>
                </div>
              )}
            </div>

            {violations.length === 0 && (
              <div className="card" style={{ textAlign: "center", padding: "var(--space-8) var(--space-4)" }}>
                <h3>No Violations Found</h3>
                <p className="text-muted" style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                  Plate {state} · {plate} has no parking violations on record.
                </p>
              </div>
            )}

            {unpaid.length > 0 && (
              <div className="card">
                <div className="card-header"><div className="card-title">Unpaid Violations</div></div>
                <div className={styles.violationList}>
                  {unpaid.map((v) => (
                    <div key={v.id} className={styles.violationItem}>
                      <div className={styles.violationDetails}>
                        <div className={styles.violationTitle}>{v.violationType}</div>
                        <div className={styles.violationMeta}>
                          <span>{v.location}</span>
                          <span>{formatDate(v.violationDate, "short")}</span>
                        </div>
                        <div className={styles.violationCitation}>Citation #{v.citationNumber}</div>
                        <div className={styles.violationDue}>Due by {formatDate(v.dueDate, "short")}</div>
                      </div>
                      <div className={styles.violationAmount}>{formatCurrency(v.fineAmount)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "var(--space-4)" }}>
                  <a href="https://pittsburghparking.com" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-full">
                    Pay on pittsburghparking.com →
                  </a>
                </div>
              </div>
            )}

            {paid.length > 0 && (
              <div className="card">
                <div className="card-header"><div className="card-title">Paid Violations</div></div>
                <div className={styles.violationList}>
                  {paid.map((v) => (
                    <div key={v.id} className={cn(styles.violationItem, styles.paidItem)}>
                      <div className={styles.violationDetails}>
                        <div className={styles.violationTitle}>{v.violationType}</div>
                        <div className={styles.violationMeta}>
                          <span>{v.location}</span>
                          <span>{formatDate(v.violationDate, "short")}</span>
                        </div>
                        <div className={styles.violationCitation}>Citation #{v.citationNumber}</div>
                      </div>
                      <div className={cn(styles.violationAmount, "credit")}>{formatCurrency(v.fineAmount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="card" style={{ padding: "var(--space-4)" }}>
          <h4 style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>Need Help?</h4>
          <p className="text-muted" style={{ fontSize: "var(--text-xs)" }}>
            Call PPA at <strong>412-560-7275</strong> or visit pittsburghparking.com to dispute a violation.
          </p>
        </div>

      </div>
    </div>
  );
}