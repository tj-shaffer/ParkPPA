"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import styles from "./revenue.module.css";

interface PaymentData {
  id: string;
  amount: string;
  dueDate: string;
  paidAt: string | null;
  status: string;
  lease: {
    garage: { name: string };
  };
}

interface MonthlyData {
  month: string;
  revenue: number;
  collected: number;
  outstanding: number;
}

interface GarageRevenue {
  name: string;
  revenue: number;
}

export default function RevenuePage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [byGarage, setByGarage] = useState<GarageRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRevenue() {
      try {
        const res = await fetch("/api/payments");
        if (!res.ok) return;
        const payments: PaymentData[] = await res.json();

        // ─── Group by month ──────────────────────────────────────────
        const monthMap = new Map<string, { revenue: number; collected: number; outstanding: number }>();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        for (const p of payments) {
          const date = new Date(p.dueDate);
          const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
          const existing = monthMap.get(key) || { revenue: 0, collected: 0, outstanding: 0 };
          const amount = parseFloat(p.amount);

          existing.revenue += amount;
          if (p.status === "PAID") existing.collected += amount;
          else existing.outstanding += amount;

          monthMap.set(key, existing);
        }

        // Sort by date and take last 6
        const sortedMonths = [...monthMap.entries()]
          .sort((a, b) => {
            const [aMonth, aYear] = a[0].split(" ");
            const [bMonth, bYear] = b[0].split(" ");
            return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
          })
          .slice(-6)
          .map(([month, data]) => ({
            month: month.split(" ")[0], // Just the month abbreviation
            ...data,
          }));

        setMonthlyData(sortedMonths);

        // ─── Group by garage ─────────────────────────────────────────
        const garageMap = new Map<string, number>();
        for (const p of payments) {
          const garageName = p.lease?.garage?.name || "Unknown";
          garageMap.set(garageName, (garageMap.get(garageName) || 0) + parseFloat(p.amount));
        }

        const sortedGarages = [...garageMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([name, revenue]) => ({ name, revenue }));

        setByGarage(sortedGarages);
      } catch (err) {
        console.error("Failed to load revenue:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRevenue();
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageTitle}>
          <h1>Revenue Dashboard</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);
  const currentMonth = monthlyData[monthlyData.length - 1] || { revenue: 0, collected: 0, outstanding: 0 };
  const prevMonth = monthlyData[monthlyData.length - 2];
  const growthPct = prevMonth && prevMonth.revenue > 0
    ? (((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100).toFixed(1)
    : "—";
  const collectionRate = currentMonth.revenue > 0
    ? ((currentMonth.collected / currentMonth.revenue) * 100).toFixed(1)
    : "0.0";

  return (
    <div className={styles.page}>
      <div className={styles.pageTitle}>
        <h1>Revenue Dashboard</h1>
        <p>Financial overview across all facilities</p>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsGrid}>
        <div className="stat-card">
          <div className="stat-card-label">Revenue MTD</div>
          <div className="stat-card-value">{formatCurrency(currentMonth.revenue)}</div>
          {growthPct !== "—" && (
            <div className="stat-card-trend up">↑ {growthPct}% vs last month</div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Collected</div>
          <div className="stat-card-value">{formatCurrency(currentMonth.collected)}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-success)", marginTop: "var(--space-2)", fontWeight: 600 }}>
            {collectionRate}% collection rate
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Outstanding</div>
          <div className="stat-card-value" style={{ color: "var(--color-danger)" }}>
            {formatCurrency(currentMonth.outstanding)}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card-header">
          <div className="card-title">Monthly Revenue Trend</div>
        </div>
        <div className={styles.chart}>
          {monthlyData.map((d) => (
            <div className={styles.chartCol} key={d.month}>
              <div className={styles.chartBarWrap}>
                <div
                  className={styles.chartBar}
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                >
                  <div
                    className={styles.chartBarCollected}
                    style={{ height: `${d.revenue > 0 ? (d.collected / d.revenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className={styles.chartLabel}>{d.month}</div>
              <div className={styles.chartValue}>
                {(d.revenue / 1000).toFixed(0)}K
              </div>
            </div>
          ))}
        </div>
        <div className={styles.chartLegend}>
          <span><span className={styles.legendDot} style={{ background: "var(--ppa-navy)" }}/> Billed</span>
          <span><span className={styles.legendDot} style={{ background: "var(--color-success)" }}/> Collected</span>
        </div>
      </div>

      {/* Revenue by Garage */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Revenue by Facility</div>
          <button className="btn btn-ghost btn-sm">Export →</button>
        </div>
        <div className={styles.garageRevList}>
          {byGarage.map((g) => (
            <div className={styles.garageRevRow} key={g.name}>
              <div className={styles.garageRevName}>{g.name}</div>
              <div className={styles.garageRevBar}>
                <div className={styles.garageRevFill} style={{ width: `${byGarage[0] ? (g.revenue / byGarage[0].revenue) * 100 : 0}%` }} />
              </div>
              <div className={styles.garageRevAmt}>{formatCurrency(g.revenue)}</div>
            </div>
          ))}
          {byGarage.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--ppa-gray-400)", padding: "var(--space-6)" }}>
              No payment data yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
