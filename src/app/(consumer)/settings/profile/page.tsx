"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import styles from "./profile.module.css";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export default function EditProfilePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // ─── Load user data from API ──────────────────────────────────────────────
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data: UserData = await res.json();
          setFirstName(data.firstName);
          setLastName(data.lastName);
          setEmail(data.email);
          setPhone(data.phone || "");
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  // ─── Save changes via API ─────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save changes.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
          <Link href="/settings" className={styles.backLink}>← Back</Link>
          <h1>Edit Profile</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <Link href="/settings" className={styles.backLink}>
          ← Back
        </Link>
        <h1>Edit Profile</h1>
        <p>Update your personal and vehicle information</p>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        
        {/* Personal Details */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Personal Details</div>
          </div>
          <div className={styles.formGrid}>
            <div className="input-group">
              <label className="input-label">First Name</label>
              <input
                type="text"
                className="input"
                name="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Last Name</label>
              <input
                type="text"
                className="input"
                name="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="input"
                name="email"
                value={email}
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
              <span style={{ fontSize: "var(--text-xs)", color: "var(--ppa-gray-400)", marginTop: "4px" }}>
                Email cannot be changed. Contact PPA support if needed.
              </span>
            </div>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label className="input-label">Phone Number</label>
              <input
                type="tel"
                className="input"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (412) 555-0142"
              />
            </div>
          </div>
        </div>

        {/* Primary Vehicle */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Primary Vehicle</div>
          </div>
          <p className="text-muted" style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-4)" }}>
            This vehicle will be registered to your active garage lease.
          </p>
          <div className={styles.formGrid}>
            <div className="input-group">
              <label className="input-label">Make</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Ford"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Model</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Escape"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label className="input-label">License Plate</label>
              <input
                type="text"
                className="input"
                style={{ textTransform: "uppercase", fontFamily: "var(--font-mono)" }}
                placeholder="ABC-1234"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: "var(--space-3)", background: "var(--color-danger-bg)", color: "var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Form Actions */}
        <div style={{ position: "sticky", bottom: "max(var(--space-4), env(safe-area-inset-bottom, 0px))", zIndex: 10 }}>
          <button 
            type="submit" 
            className={cn("btn btn-primary btn-full", saving && styles.loading)}
            disabled={saving}
          >
            {saving ? <span className={styles.spinner} /> : saved ? "✅ Saved successfully" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
