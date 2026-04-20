"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, cn, occupancyPercent, occupancyLevel } from "@/lib/utils";
import styles from "./garages.module.css";

interface Garage {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  totalSpaces: number;
  leasedSpaces: number;
  monthlyRate: string;
  residentMonthlyRate: string | null;
  status: string;
}

export default function GaragesPage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGarages() {
      try {
        const res = await fetch("/api/garages");
        if (res.ok) setGarages(await res.json());
      } catch (err) {
        console.error("Failed to load garages:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGarages();
  }, []);

  const totalSpaces = garages.reduce((s, g) => s + g.totalSpaces, 0);
  const totalLeased = garages.reduce((s, g) => s + g.leasedSpaces, 0);
  const overallOcc = occupancyPercent(totalLeased, totalSpaces);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageTitle}>
          <div>
            <h1>Garages & Facilities</h1>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageTitle}>
        <div>
          <h1>Garages & Facilities</h1>
          <p>Manage all {garages.length} PPA facilities</p>
        </div>
        <button className="btn btn-primary" id="btn-add-garage">
          + Add Facility
        </button>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className="stat-card">
          <div className="stat-card-label">Total Facilities</div>
          <div className="stat-card-value">{garages.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Capacity</div>
          <div className="stat-card-value">{totalSpaces.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Leased</div>
          <div className="stat-card-value">{totalLeased.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Overall Occupancy</div>
          <div className="stat-card-value">{overallOcc}%</div>
        </div>
      </div>

      {/* Garage Cards */}
      <div className={cn(styles.garageGrid, "stagger-in")}>
        {garages.map((garage) => {
          const occ = occupancyPercent(garage.leasedSpaces, garage.totalSpaces);
          const level = occupancyLevel(occ);
          return (
            <Link
              href={`/admin/garages/${garage.id}`}
              className={cn("card card-interactive", styles.garageCard)}
              key={garage.id}
            >
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.garageName}>{garage.name}</div>
                  <div className={styles.garageNeighborhood}>{garage.neighborhood}</div>
                </div>
                <span className={cn("badge", garage.status === "ACTIVE" ? "badge-success" : "badge-warning")}>
                  <span className="badge-dot" />
                  {garage.status === "ACTIVE" ? "Active" : "Maintenance"}
                </span>
              </div>

              <div className={styles.garageAddress}>{garage.address}</div>

              <div className={styles.occSection}>
                <div className={styles.occHeader}>
                  <span className={styles.occLabel}>Occupancy</span>
                  <span className={cn(styles.occValue, "mono")}>{occ}%</span>
                </div>
                <div className="capacity-bar">
                  <div className={cn("capacity-bar-fill", level)} style={{ width: `${occ}%` }} />
                </div>
                <div className={styles.occMeta}>
                  {garage.leasedSpaces} / {garage.totalSpaces} spots leased
                </div>
              </div>

              <div className={styles.rateRow}>
                <div className={styles.rate}>
                  <span className={styles.rateLabel}>Standard</span>
                  <span className={cn(styles.rateValue, "mono")}>{formatCurrency(garage.monthlyRate)}</span>
                </div>
                {garage.residentMonthlyRate && (
                  <div className={styles.rate}>
                    <span className={styles.rateLabel}>Resident</span>
                    <span className={cn(styles.rateValue, "mono")}>{formatCurrency(garage.residentMonthlyRate)}</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
