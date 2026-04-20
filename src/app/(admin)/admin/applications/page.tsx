"use client";

import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import styles from "./applications.module.css";
import { useState } from "react";

const DEMO_APPLICATIONS = [
  {
    id: "app-104",
    applicant: "Sarah Jenkins",
    email: "sarah.j@example.com",
    garage: "Third Avenue Garage",
    type: "Downtown Resident",
    submitted: "2026-04-15T08:30:00Z",
    status: "PENDING"
  },
  {
    id: "app-105",
    applicant: "Michael Chang",
    email: "mchang@example.com",
    garage: "Smithfield-Liberty Garage",
    type: "Standard 24-Hour",
    submitted: "2026-04-14T15:45:00Z",
    status: "APPROVED"
  },
  {
    id: "app-106",
    applicant: "Amanda Rossi",
    email: "arossi99@example.com",
    garage: "Mellon Square Garage",
    type: "Downtown Resident",
    submitted: "2026-04-14T11:20:00Z",
    status: "REJECTED"
  }
];

export default function AdminApplicationsPage() {
  const [filter, setFilter] = useState("PENDING");

  const filteredApps = DEMO_APPLICATIONS.filter(app => {
    if (filter === "ALL") return true;
    return app.status === filter;
  });

  return (
    <div className="page-content stagger-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-1)" }}>Applications</h1>
          <p className="text-muted">Review and approve new lease requests</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4" style={{ marginBottom: "var(--space-6)" }}>
        <div className="stat-card">
          <div className="stat-card-label">Pending Review</div>
          <div className="stat-card-value">12</div>
          <div className="stat-card-trend up">Requires Action</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Approved (MTD)</div>
          <div className="stat-card-value">48</div>
          <div className="stat-card-trend up">↑ 3% vs last month</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Rejected (MTD)</div>
          <div className="stat-card-value">5</div>
          <div className="stat-card-trend down">Invalid documents</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card">
        {/* Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 var(--space-4)", borderBottom: "1px solid var(--ppa-gray-100)", marginBottom: "var(--space-4)" }}>
          <div className={styles.filterPills}>
            <button className={cn(styles.pill, filter === "PENDING" && styles.pillActive)} onClick={() => setFilter("PENDING")}>
              Pending (12)
            </button>
            <button className={cn(styles.pill, filter === "APPROVED" && styles.pillActive)} onClick={() => setFilter("APPROVED")}>
              Approved
            </button>
            <button className={cn(styles.pill, filter === "REJECTED" && styles.pillActive)} onClick={() => setFilter("REJECTED")}>
              Rejected
            </button>
            <button className={cn(styles.pill, filter === "ALL" && styles.pillActive)} onClick={() => setFilter("ALL")}>
              All Apps
            </button>
          </div>
          
          <div className="input-group" style={{ width: "250px" }}>
            <input type="text" className="input" placeholder="Search applicant..." style={{ padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-sm)" }} />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Garage</th>
                <th>Desired Rate</th>
                <th>Submitted</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--ppa-navy)" }}>{app.applicant}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ppa-gray-500)" }}>{app.email}</div>
                  </td>
                  <td>{app.garage}</td>
                  <td>
                    {app.type}
                    {app.type.includes("Resident") && (
                      <span className="badge badge-warning" style={{ marginLeft: "var(--space-2)" }}>Docs Req</span>
                    )}
                  </td>
                  <td className="text-muted">{formatDate(app.submitted, "short")}</td>
                  <td>
                    <span className={cn(
                      "badge",
                      app.status === "APPROVED" ? "badge-success" : app.status === "PENDING" ? "badge-warning" : "badge-danger"
                    )}>
                      <span className="badge-dot" />
                      {app.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/admin/applications/${app.id}`} className="btn btn-outline btn-sm">
                      {app.status === "PENDING" ? "Review" : "View"}
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-8) 0" }}>
                    <div className="text-muted">No applications found in this status.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
