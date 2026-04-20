"use client";

import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./app-detail.module.css";

export default function ApplicationDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState("PENDING");
  const [actionLoading, setActionLoading] = useState(false);

  // Mock data for this route
  const isResident = true;

  const handleAction = async (newStatus: string) => {
    setActionLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setStatus(newStatus);
    setActionLoading(false);
  };

  return (
    <div className="page-content stagger-in">
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <Link href="/admin/applications" className="btn btn-ghost btn-sm" style={{ padding: 0, marginBottom: "var(--space-2)", color: "var(--ppa-blue-pale)" }}>
          ← Back to Queue
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1>Review Application</h1>
            <p className="text-muted">Sarah Jenkins — {params.id}</p>
          </div>
          <span className={cn("badge", status === "PENDING" ? "badge-warning" : status === "APPROVED" ? "badge-success" : "badge-danger")}>
            <span className="badge-dot" />
            {status}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Left Column: Data */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          
          <div className="card">
            <div className="card-header">
              <div className="card-title">Applicant Details</div>
            </div>
            <div className={styles.detailRow}>
              <span>Name</span>
              <span className={styles.detailVal}>Sarah Jenkins</span>
            </div>
            <div className={styles.detailRow}>
              <span>Email</span>
              <span className={styles.detailVal}>sarah.j@example.com</span>
            </div>
            <div className={styles.detailRow}>
              <span>Phone</span>
              <span className={styles.detailVal}>(412) 555-9876</span>
            </div>
            <div className={styles.detailRow}>
              <span>Address Profile</span>
              <span className={styles.detailVal}>400 5th Ave, Apt 12B<br/>Pittsburgh, PA 15219</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Request</div>
            </div>
            <div className={styles.detailRow}>
              <span>Garage</span>
              <span className={styles.detailVal}>Third Avenue Garage</span>
            </div>
            <div className={styles.detailRow}>
              <span>Rate Plan</span>
              <span className={styles.detailVal}>Downtown Resident</span>
            </div>
            <div className={styles.detailRow}>
              <span>Expected Rate</span>
              <span className={styles.detailVal}>{formatCurrency(175)}/month</span>
            </div>
            <div className={styles.detailRow}>
              <span>Deposit Held</span>
              <span className={styles.detailVal} style={{ color: "var(--color-warning)" }}>{formatCurrency(175)} (Authorized)</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Vehicle</div>
            </div>
            <div className={styles.detailRow}>
              <span>Make & Model</span>
              <span className={styles.detailVal}>Honda Civic</span>
            </div>
            <div className={styles.detailRow}>
              <span>License Plate</span>
              <span className={styles.detailVal} style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>KWM-1234</span>
            </div>
          </div>

        </div>

        {/* Right Column: Documents */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <div className="card-header">
              <div className="card-title">Document Verification</div>
              <div className="badge badge-warning">Action Required</div>
            </div>
            <p className="text-muted" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
              Verify that the IDs match the applicant name and address provided.
            </p>

            <div className={styles.docList}>
              <div className={styles.docItem}>
                <div className={styles.docHeader}>
                  <span>🪪 Driver's License</span>
                  <button className="btn btn-ghost btn-sm">View Full</button>
                </div>
                <div className={styles.docPreview}>
                  <div className={styles.mockOverlay}>DL_FRONT_MOCK.JPG</div>
                </div>
              </div>

              <div className={styles.docItem}>
                <div className={styles.docHeader}>
                  <span>📄 Proof of Residency</span>
                  <button className="btn btn-ghost btn-sm">View Full</button>
                </div>
                <div className={styles.docPreview}>
                  <div className={styles.mockOverlay}>DUPUESQUESNE_LIGHT_BILL.PDF</div>
                </div>
              </div>

              <div className={styles.docItem}>
                <div className={styles.docHeader}>
                  <span>🚗 Vehicle Registration</span>
                  <button className="btn btn-ghost btn-sm">View Full</button>
                </div>
                <div className={styles.docPreview}>
                  <div className={styles.mockOverlay}>PENNDOT_REG.JPG</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Action Footer */}
      {status === "PENDING" && (
        <div className={styles.actionFooter}>
          <button 
            className="btn btn-outline" 
            style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
            onClick={() => handleAction("REJECTED")}
            disabled={actionLoading}
          >
            Reject Application
          </button>
          
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <button 
              className="btn btn-outline" 
              onClick={() => handleAction("MORE_INFO")}
              disabled={actionLoading}
            >
              Request Clearer Docs
            </button>
            <button 
              className="btn btn-primary" 
              style={{ background: "var(--color-success)" }}
              onClick={() => handleAction("APPROVED")}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Approve & Capture Deposit"}
            </button>
          </div>
        </div>
      )}

      {status === "APPROVED" && (
        <div className="card" style={{ marginTop: "var(--space-6)", background: "var(--color-success-light)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
          <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
            <div style={{ fontSize: "var(--text-2xl)" }}>✅</div>
            <div>
              <h3 style={{ color: "var(--color-success-dark)", marginBottom: "var(--space-1)" }}>Application Approved</h3>
              <p style={{ color: "var(--color-success-dark)", fontSize: "var(--text-sm)" }}>
                The $175 deposit was captured. A welcome SMS was sent to the applicant instructing them to pick up their access card.
              </p>
            </div>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: "auto", background: "white" }} onClick={() => router.push("/admin/leases")}>
              View Lease Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
