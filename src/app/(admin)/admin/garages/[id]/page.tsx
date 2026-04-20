"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatCurrency, cn, occupancyPercent, occupancyLevel } from "@/lib/utils";
import styles from "./garage-detail.module.css";

interface LeaseUser {
  firstName: string;
  lastName: string;
}

interface LeasePayment {
  status: string;
  amount: string;
}

interface GarageLease {
  id: string;
  leaseNumber: string;
  spotNumber: string | null;
  type: string;
  monthlyRate: string;
  isResident: boolean;
  status: string;
  user: LeaseUser;
  payments: LeasePayment[];
}

interface GarageDetail {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  phone: string | null;
  email: string | null;
  status: string;
  totalSpaces: number;
  leasedSpaces: number;
  monthlyRate: string;
  residentMonthlyRate: string | null;
  daytimeRate: string | null;
  nightRate: string | null;
  operatingHours: string | null;
  leases: GarageLease[];
}

function typeLabel(type: string) {
  switch (type) {
    case "TWENTY_FOUR_HR": return "24HR";
    case "DAYTIME": return "Daytime";
    case "NIGHTTIME": return "Night";
    case "WEEKEND": return "Weekend";
    default: return type;
  }
}

export default function GarageDetailPage() {
  const params = useParams();
  const [garage, setGarage] = useState<GarageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGarage() {
      try {
        const res = await fetch(`/api/garages/${params.id}`);
        if (res.ok) setGarage(await res.json());
      } catch (err) {
        console.error("Failed to load garage:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGarage();
  }, [params.id]);

  if (loading || !garage) {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <Link href="/admin/garages" className={styles.backLink}>← Back to Garages</Link>
          <h1>{loading ? "Loading..." : "Garage not found"}</h1>
        </div>
      </div>
    );
  }

  const occ = occupancyPercent(garage.leasedSpaces, garage.totalSpaces);
  const level = occupancyLevel(occ);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <Link href="/admin/garages" className={styles.backLink}>
          ← Back to Garages
        </Link>
        <div className={styles.titleRow}>
          <div>
            <h1>{garage.name}</h1>
            <p>{garage.address} • {garage.neighborhood}</p>
          </div>
          <span className={cn("badge", garage.status === "ACTIVE" ? "badge-success" : "badge-warning")} style={{ fontSize: "var(--text-sm)", padding: "6px 14px" }}>
            <span className="badge-dot" />
            {garage.status === "ACTIVE" ? "Active" : "Maintenance"}
          </span>
        </div>
      </div>

      {/* Info + Occupancy */}
      <div className={styles.topGrid}>
        {/* Occupancy Donut */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Occupancy</div>
          </div>
          <div className={styles.donutWrap}>
            <svg viewBox="0 0 120 120" className={styles.donut}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--ppa-gray-100)" strokeWidth="12" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={level === "high" ? "var(--color-danger)" : level === "medium" ? "var(--color-warning)" : "var(--color-success)"}
                strokeWidth="12"
                strokeDasharray={`${occ * 3.14} ${(100 - occ) * 3.14}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
              <text x="60" y="56" textAnchor="middle" fill="var(--ppa-navy)" fontFamily="'JetBrains Mono', monospace" fontWeight="800" fontSize="28">{occ}%</text>
              <text x="60" y="74" textAnchor="middle" fill="var(--ppa-gray-400)" fontFamily="Inter, sans-serif" fontSize="10">occupied</text>
            </svg>
          </div>
          <div className={styles.occStats}>
            <div className={styles.occStat}>
              <span className={styles.occStatValue}>{garage.leasedSpaces}</span>
              <span className={styles.occStatLabel}>Leased</span>
            </div>
            <div className={styles.occStat}>
              <span className={styles.occStatValue}>{garage.totalSpaces - garage.leasedSpaces}</span>
              <span className={styles.occStatLabel}>Available</span>
            </div>
            <div className={styles.occStat}>
              <span className={styles.occStatValue}>{garage.totalSpaces}</span>
              <span className={styles.occStatLabel}>Total</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Facility Details</div>
            <button className="btn btn-ghost btn-sm">Edit</button>
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Hours</div>
              <div className={styles.infoValue}>{garage.operatingHours || "—"}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Phone</div>
              <div className={styles.infoValue}>{garage.phone || "—"}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.infoLabel}>Email</div>
              <div className={styles.infoValue}>{garage.email || "—"}</div>
            </div>
          </div>

          <hr className="divider" />

          <div className="card-title" style={{ marginBottom: "var(--space-3)", fontSize: "var(--text-sm)" }}>Rate Schedule</div>
          <div className={styles.rateGrid}>
            <div className={styles.rateItem}>
              <span className={styles.rateLabel}>Standard 24hr</span>
              <span className={cn(styles.rateValue, "mono")}>{formatCurrency(garage.monthlyRate)}/mo</span>
            </div>
            {garage.residentMonthlyRate && (
              <div className={styles.rateItem}>
                <span className={styles.rateLabel}>Resident 24hr</span>
                <span className={cn(styles.rateValue, "mono")}>{formatCurrency(garage.residentMonthlyRate)}/mo</span>
              </div>
            )}
            {garage.daytimeRate && (
              <div className={styles.rateItem}>
                <span className={styles.rateLabel}>Daytime Only</span>
                <span className={cn(styles.rateValue, "mono")}>{formatCurrency(garage.daytimeRate)}/mo</span>
              </div>
            )}
            {garage.nightRate && (
              <div className={styles.rateItem}>
                <span className={styles.rateLabel}>Night Only</span>
                <span className={cn(styles.rateValue, "mono")}>{formatCurrency(garage.nightRate)}/mo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actionRow}>
        <button className="btn btn-primary">+ Create Lease</button>
        <button className="btn btn-outline">📢 Send Announcement</button>
        <button className="btn btn-outline">Adjust Rates</button>
        <button className="btn btn-outline" style={{ color: "var(--color-warning)" }}>🚧 Maintenance Mode</button>
      </div>

      {/* Recent Leases */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "var(--space-5) var(--space-5) 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="card-title">Recent Leases ({garage.leases.length})</div>
          <Link href="/admin/leases" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        <table className="data-table" style={{ marginTop: "var(--space-3)" }}>
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Spot</th>
              <th>Type</th>
              <th>Rate</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {garage.leases.map((l) => {
              const lastPayment = l.payments[0];
              const payStatus = lastPayment?.status || "PENDING";
              return (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600, color: "var(--ppa-navy)" }}>
                    {l.user.firstName} {l.user.lastName}
                  </td>
                  <td className="mono">{l.spotNumber || "—"}</td>
                  <td>{typeLabel(l.type)}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{formatCurrency(l.monthlyRate)}</td>
                  <td>
                    <span className={cn("badge",
                      payStatus === "PAID" ? "badge-success" :
                      payStatus === "PENDING" ? "badge-warning" : "badge-danger"
                    )}>
                      <span className="badge-dot" />
                      {payStatus === "PAID" ? "Current" : payStatus === "PENDING" ? "Due" : "Past Due"}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm">View</button>
                  </td>
                </tr>
              );
            })}
            {garage.leases.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--ppa-gray-400)" }}>
                  No leases for this facility yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
