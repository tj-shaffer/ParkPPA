"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import styles from "./leases.module.css";

type FilterType = "all" | "ACTIVE" | "EXPIRED" | "past_due";

interface LeaseData {
  id: string;
  leaseNumber: string;
  spotNumber: string | null;
  type: string;
  monthlyRate: string;
  isResident: boolean;
  status: string;
  startDate: string;
  user: { firstName: string; lastName: string; email: string };
  garage: { name: string };
  payments: { status: string; amount: string; dueDate: string }[];
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<LeaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchLeases() {
      try {
        const res = await fetch("/api/leases");
        if (res.ok) setLeases(await res.json());
      } catch (err) {
        console.error("Failed to load leases:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeases();
  }, []);

  // Compute payment status per lease
  function getPaymentInfo(lease: LeaseData) {
    const pastDue = lease.payments.filter((p) => p.status === "PAST_DUE");
    const pending = lease.payments.filter((p) => p.status === "PENDING");
    if (pastDue.length > 0) {
      const total = pastDue.reduce((s, p) => s + parseFloat(p.amount), 0);
      return { status: "PAST_DUE" as const, dueAmount: total };
    }
    if (pending.length > 0) {
      return { status: "PENDING" as const, dueAmount: parseFloat(pending[0].amount) };
    }
    return { status: "PAID" as const, dueAmount: 0 };
  }

  const filtered = leases.filter((l) => {
    const payInfo = getPaymentInfo(l);
    if (filter === "past_due") return payInfo.status === "PAST_DUE";
    if (filter !== "all" && l.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${l.user.firstName} ${l.user.lastName}`.toLowerCase();
      return (
        name.includes(q) ||
        l.leaseNumber.toLowerCase().includes(q) ||
        l.garage.name.toLowerCase().includes(q) ||
        l.user.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pastDueCount = leases.filter((l) => getPaymentInfo(l).status === "PAST_DUE").length;
  const totalOutstanding = leases.reduce((s, l) => s + getPaymentInfo(l).dueAmount, 0);

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: "all", label: "All Leases" },
    { key: "ACTIVE", label: "Active" },
    { key: "past_due", label: "Past Due", count: pastDueCount },
    { key: "EXPIRED", label: "Expired" },
  ];

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageTitle}>
          <div><h1>Lease Management</h1><p>Loading...</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageTitle}>
        <div>
          <h1>Lease Management</h1>
          <p>
            {leases.length} leases • {formatCurrency(totalOutstanding)} outstanding
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button className="btn btn-outline" id="btn-export-csv">
            Export CSV
          </button>
          <button className="btn btn-primary" id="btn-create-lease">
            + New Lease
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <input
          type="text"
          className="input"
          placeholder="Search by name, lease #, garage, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="lease-search"
          style={{ maxWidth: "400px" }}
        />
        <div className={styles.filterRow}>
          {filters.map((f) => (
            <button
              key={f.key}
              className={cn(styles.filterBtn, filter === f.key && styles.filterActive)}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className={styles.filterCount}>{f.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Lease #</th>
              <th>Tenant</th>
              <th>Garage</th>
              <th>Spot</th>
              <th>Rate</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lease) => {
              const payInfo = getPaymentInfo(lease);
              return (
                <tr key={lease.id}>
                  <td>
                    <span className="mono" style={{ fontWeight: 600, fontSize: "var(--text-xs)" }}>
                      {lease.leaseNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--ppa-navy)" }}>
                      {lease.user.firstName} {lease.user.lastName}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ppa-gray-400)" }}>
                      {lease.user.email}
                    </div>
                  </td>
                  <td>{lease.garage.name}</td>
                  <td className="mono">{lease.spotNumber || "—"}</td>
                  <td>
                    <span className="mono" style={{ fontWeight: 600 }}>{formatCurrency(lease.monthlyRate)}</span>
                    {lease.isResident && (
                      <span className="badge badge-info" style={{ marginLeft: "4px", fontSize: "9px" }}>RES</span>
                    )}
                  </td>
                  <td>
                    {payInfo.status === "PAID" && (
                      <span className="badge badge-success"><span className="badge-dot" />Current</span>
                    )}
                    {payInfo.status === "PENDING" && (
                      <span className="badge badge-warning"><span className="badge-dot" />Due</span>
                    )}
                    {payInfo.status === "PAST_DUE" && (
                      <span className="badge badge-danger">
                        <span className="badge-dot" />
                        {formatCurrency(payInfo.dueAmount)} overdue
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={cn("badge", lease.status === "ACTIVE" ? "badge-success" : "badge-neutral")}>
                      {lease.status === "ACTIVE" ? "Active" : "Expired"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-1)" }}>
                      <button className="btn btn-ghost btn-sm">View</button>
                      {payInfo.status === "PAST_DUE" && (
                        <button className="btn btn-primary btn-sm">Remind</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="clipboard" size={28} /></div>
            <div className="empty-state-title">No leases found</div>
            <div className="empty-state-desc">Try adjusting your search or filters.</div>
          </div>
        )}
      </div>
    </div>
  );
}
