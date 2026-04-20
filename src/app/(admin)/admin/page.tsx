"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, cn, occupancyPercent, occupancyLevel } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import styles from "./admin-dashboard.module.css";

interface Garage {
  id: string;
  name: string;
  totalSpaces: number;
  leasedSpaces: number;
  monthlyRate: string;
  status: string;
}

export default function AdminDashboardPage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/garages");
        if (res.ok) setGarages(await res.json());
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ─── Computed Stats ─────────────────────────────────────────────────────
  const totalLeased = garages.reduce((s, g) => s + g.leasedSpaces, 0);
  const totalSpaces = garages.reduce((s, g) => s + g.totalSpaces, 0);
  const avgOccupancy = totalSpaces > 0 ? Math.round((totalLeased / totalSpaces) * 100) : 0;
  const estRevenue = garages.reduce((s, g) => s + g.leasedSpaces * parseFloat(g.monthlyRate), 0);

  const stats = [
    { label: "Total Garages", value: String(garages.length), trend: null, iconName: "building" as const },
    { label: "Active Leases", value: totalLeased.toLocaleString(), trend: "Live data", trendDir: "up" as const, iconName: "clipboard" as const },
    { label: "Occupancy", value: `${avgOccupancy}%`, trend: `${totalLeased}/${totalSpaces} spots`, trendDir: "up" as const, iconName: "bar-chart" as const },
    { label: "Revenue MTD (est)", value: formatCurrency(estRevenue), trend: "Based on leased spots", trendDir: "up" as const, iconName: "dollar-sign" as const },
  ];

  const ALERTS = [
    { type: "danger", color: "var(--color-danger)", message: "47 leases with past-due payments", action: "View", href: "/admin/leases" },
    { type: "warning", color: "var(--color-warning)", message: "12 leases expiring within 30 days", action: "Review", href: "/admin/leases" },
    { type: "info", color: "var(--color-info)", message: `${garages.filter(g => g.status === "MAINTENANCE").length} garages in maintenance`, action: "Details", href: "/admin/garages" },
    { type: "success", color: "var(--color-success)", message: `${garages.filter(g => g.status === "ACTIVE").length} garages fully operational`, action: "View", href: "/admin/garages" },
  ];

  if (loading) {
    return (
      <div className={styles.adminDash}>
        <div className={styles.pageTitle}>
          <h1>Dashboard</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminDash}>
      <div className={styles.pageTitle}>
        <h1>Dashboard</h1>
        <p>Pittsburgh Parking Authority — System Overview</p>
      </div>

      {/* Stats Grid */}
      <div className={cn(styles.statsGrid, "stagger-in")}>
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="stat-card-label">{stat.label}</div>
                <div className="stat-card-value">{stat.value}</div>
              </div>
              <span style={{ color: "var(--ppa-blue-mid)" }}><Icon name={stat.iconName} size={24} /></span>
            </div>
            {stat.trend && (
              <div className={cn("stat-card-trend", stat.trendDir)}>
                {stat.trendDir === "up" ? <Icon name="arrow-right" size={12} style={{ transform: "rotate(-45deg)" }} /> : <Icon name="arrow-right" size={12} style={{ transform: "rotate(45deg)" }} />} {stat.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className={cn("card", styles.alertsCard)}>
        <div className="card-header">
          <div className="card-title">Active Alerts</div>
          <span className={styles.alertCount}>{ALERTS.length}</span>
        </div>
        <div className={styles.alertList}>
          {ALERTS.map((alert, i) => (
            <div className={styles.alertItem} key={i}>
              <span className={styles.alertDot} style={{ width: "8px", height: "8px", borderRadius: "50%", background: alert.color, display: "inline-block" }} />
              <span className={styles.alertMessage}>{alert.message}</span>
              <Link href={alert.href} className="btn btn-ghost btn-sm">{alert.action} <Icon name="chevron-right" size={12} /></Link>
            </div>
          ))}
        </div>
      </div>

      {/* Garage Overview — from real DB */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Garage Overview</div>
          <Link href="/admin/garages" className="btn btn-ghost btn-sm">Manage <Icon name="chevron-right" size={12} /></Link>
        </div>

        <div className={styles.garageList}>
          <div className={styles.garageHeader}>
            <span className={styles.col1}>Facility</span>
            <span className={styles.col2}>Occupancy</span>
            <span className={styles.col3}>Rate</span>
            <span className={styles.col4}>Status</span>
          </div>

          {garages.map((garage) => {
            const occ = occupancyPercent(garage.leasedSpaces, garage.totalSpaces);
            const level = occupancyLevel(occ);
            return (
              <Link href={`/admin/garages/${garage.id}`} className={styles.garageRow} key={garage.id}>
                <div className={styles.col1}>
                  <div className={styles.garageName}>{garage.name}</div>
                  <div className={styles.garageMeta}>{garage.leasedSpaces} / {garage.totalSpaces} spots</div>
                </div>
                <div className={styles.col2}>
                  <div className={styles.occValue}>{occ}%</div>
                  <div className="capacity-bar" style={{ width: "80px" }}>
                    <div className={cn("capacity-bar-fill", level)} style={{ width: `${occ}%` }} />
                  </div>
                </div>
                <div className={cn(styles.col3, "mono")}>{formatCurrency(garage.monthlyRate)}/mo</div>
                <div className={styles.col4}>
                  <span className={cn("badge", garage.status === "ACTIVE" ? "badge-success" : garage.status === "MAINTENANCE" ? "badge-warning" : "badge-danger")}>
                    <span className="badge-dot" />
                    {garage.status === "ACTIVE" ? "Active" : garage.status === "MAINTENANCE" ? "Maintenance" : "Closed"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
