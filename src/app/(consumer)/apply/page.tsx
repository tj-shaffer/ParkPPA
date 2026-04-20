"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/icons/Icon";
import styles from "./apply.module.css";
import { useRouter } from "next/navigation";

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [garages, setGarages] = useState<{id: string, name: string}[]>([]);
  
  // Fetch real garages on load
  useEffect(() => {
    fetch("/api/garages")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setGarages(data);
      })
      .catch(console.error);
  }, []);

  // Form State
  const [garageId, setGarageId] = useState("");
  const [leaseType, setLeaseType] = useState<"standard" | "resident">("standard");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  
  // Document Upload State (Mocked)
  const [uploadedLicense, setUploadedLicense] = useState(false);
  const [uploadedResidency, setUploadedResidency] = useState(false);
  const [uploadedRegistration, setUploadedRegistration] = useState(false);
  
  // Checkout State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const price = leaseType === "resident" ? 175.00 : 225.00;

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garageId,
          isResident: leaseType === "resident",
          monthlyRate: price,
          make,
          model,
          plate
        }),
      });
      if (res.ok) {
        setStep(5); // Success step
      } else {
        alert("Failed to submit application");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("page", styles.applyPage)}>
      <div className="page-header">
        <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ padding: 0, marginBottom: "var(--space-2)", color: "var(--ppa-blue-pale)" }}>
          ← Cancel
        </Link>
        <h1>Secure a Spot</h1>
        <p>Apply for a monthly garage lease</p>
      </div>

      {/* Progress Bar (Hidden on Success) */}
      {step < 5 && (
        <div className={styles.progressContainer}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                styles.progressPill,
                step === i && styles.active,
                step > i && styles.completed
              )}
            />
          ))}
        </div>
      )}

      {/* STEP 1: Selection */}
      {step === 1 && (
        <div className={styles.wizardStep}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">1. Select Garage & Plan</div>
            </div>
            
            <div className="input-group" style={{ marginBottom: "var(--space-5)" }}>
              <label className="input-label">Select Facility</label>
              <select 
                className="input" 
                value={garageId} 
                onChange={(e) => setGarageId(e.target.value)}
              >
                <option value="" disabled>Choose a garage...</option>
                {garages.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="input-label" style={{ marginBottom: "var(--space-2)" }}>Rate Plan</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
              <div 
                className={cn(styles.optionCard, leaseType === "standard" && styles.selected)}
                onClick={() => setLeaseType("standard")}
              >
                <div className={styles.optionTitle}>
                  Standard 24-Hour <span className={styles.optionPrice}>$225.00/mo</span>
                </div>
                <div className={styles.optionDesc}>Unlimited 24/7 access. Open to the general public.</div>
              </div>

              <div 
                className={cn(styles.optionCard, leaseType === "resident" && styles.selected)}
                onClick={() => setLeaseType("resident")}
              >
                <div className={styles.optionTitle}>
                  Downtown Resident <span className={styles.optionPrice}>$175.00/mo</span>
                </div>
                <div className={styles.optionDesc}>Discounted 24/7 access for verified downtown residents.</div>
                {leaseType === "resident" && (
                  <div className="badge badge-warning" style={{ alignSelf: "flex-start", marginTop: "var(--space-2)" }}>
                    Requires Document Review
                  </div>
                )}
              </div>
            </div>

            <button 
              className="btn btn-primary btn-full" 
              onClick={handleNext}
              disabled={!garageId}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Vehicle Info */}
      {step === 2 && (
        <div className={styles.wizardStep}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">2. Primary Vehicle</div>
            </div>
            <p className="text-muted" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
              This vehicle will be registered to your new lease.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
              <div className="input-group">
                <label className="input-label">Make</label>
                <input type="text" className="input" placeholder="e.g. Honda" value={make} onChange={(e) => setMake(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Model</label>
                <input type="text" className="input" placeholder="e.g. Civic" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">License Plate Number</label>
                <input type="text" className="input" placeholder="ABC-1234" value={plate} onChange={(e) => setPlate(e.target.value)} style={{ textTransform: "uppercase" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <button className="btn btn-outline" onClick={handleBack}>Back</button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={() => setStep(leaseType === "resident" ? 3 : 4)}
                disabled={!make || !model || !plate}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Document Uploads (Resident Only) */}
      {step === 3 && (
        <div className={styles.wizardStep}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">3. Required Documents</div>
            </div>
            <p className="text-muted" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
              Because you selected the Resident rate, the PPA requires proof of your downtown residency.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
              
              <div 
                className={cn(styles.uploadZone, uploadedLicense && styles.uploaded)}
                onClick={() => setUploadedLicense(true)}
              >
                <div className={styles.uploadIcon}>{uploadedLicense ? <Icon name="check-circle" size={24} /> : <Icon name="id-card" size={24} />}</div>
                <div className={styles.uploadTitle}>Valid Driver's License</div>
                <div className={styles.uploadSub}>{uploadedLicense ? "dl_front.jpg uploaded" : "Tap to upload photo"}</div>
              </div>

              <div 
                className={cn(styles.uploadZone, uploadedResidency && styles.uploaded)}
                onClick={() => setUploadedResidency(true)}
              >
                <div className={styles.uploadIcon}>{uploadedResidency ? <Icon name="check-circle" size={24} /> : <Icon name="file-text" size={24} />}</div>
                <div className={styles.uploadTitle}>Proof of Residency</div>
                <div className={styles.uploadSub}>{uploadedResidency ? "lease_agreement.pdf uploaded" : "Lease agreement or utility bill (gas/electric/cable)"}</div>
              </div>

              <div 
                className={cn(styles.uploadZone, uploadedRegistration && styles.uploaded)}
                onClick={() => setUploadedRegistration(true)}
              >
                <div className={styles.uploadIcon}>{uploadedRegistration ? <Icon name="check-circle" size={24} /> : <Icon name="car" size={24} />}</div>
                <div className={styles.uploadTitle}>Vehicle Registration</div>
                <div className={styles.uploadSub}>{uploadedRegistration ? "registration.jpg uploaded" : "Tap to upload current registration"}</div>
              </div>

            </div>

            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <button className="btn btn-outline" onClick={handleBack}>Back</button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={handleNext}
                disabled={!uploadedLicense || !uploadedResidency || !uploadedRegistration}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Payment Hold */}
      {step === 4 && (
        <div className={styles.wizardStep}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">4. Review & Deposit</div>
            </div>
            
            <div className={styles.reviewList}>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Garage</span>
                <span className={styles.reviewVal}>{garages.find(g => g.id === garageId)?.name || "Selected Garage"}</span>
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Rate Plan</span>
                <span className={styles.reviewVal}>{leaseType === "resident" ? "Downtown Resident" : "Standard 24-Hour"}</span>
              </div>
              {leaseType === "resident" && (
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Documents</span>
                  <span className={styles.reviewVal} style={{ color: "var(--color-success)" }}>Verified Attached</span>
                </div>
              )}
            </div>

            <div className={styles.totalRow}>
              <span>First Month Deposit</span>
              <span>${price.toFixed(2)}</span>
            </div>

            <div className="badge badge-info" style={{ marginTop: "var(--space-4)", display: "flex", whiteSpace: "normal", padding: "var(--space-2)", fontSize: "var(--text-xs)" }}>
              <span style={{ fontSize: "16px", marginRight: "var(--space-2)", display: "inline-flex" }}><Icon name="info" size={16} /></span>
              This will place an authorization hold on your card. You will not be charged until a PPA agent approves your application.
            </div>

            <hr className="divider" />

            <div className="input-group" style={{ marginBottom: "var(--space-5)" }}>
              <label className="input-label">Credit Card</label>
              <div style={{ padding: "var(--space-3)", border: "1.5px solid var(--ppa-gray-200)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span><Icon name="credit-card" size={18} /></span>
                <span style={{ fontFamily: "var(--font-mono)", flex: 1 }}>•••• •••• •••• 4242</span>
                <span className="text-muted" style={{ fontSize: "var(--text-sm)" }}>12/27</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <button className="btn btn-outline" onClick={() => setStep(leaseType === "resident" ? 3 : 2)} disabled={isSubmitting}>Back</button>
              <button 
                className={cn("btn btn-primary", isSubmitting && styles.loading)}
                style={{ flex: 1 }} 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Authorizing..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Success */}
      {step === 5 && (
        <div className={styles.wizardStep}>
          <div className="empty-state">
            <div className={styles.successIcon}><Icon name="party" size={48} /></div>
            <h2 className="empty-state-title" style={{ fontSize: "var(--text-2xl)" }}>Application Submitted!</h2>
            <p className="empty-state-desc" style={{ marginBottom: "var(--space-6)" }}>
              Your application for a <strong>{leaseType === "resident" ? "Downtown Resident" : "Standard"}</strong> lease at <strong>{garages.find(g => g.id === garageId)?.name || "Selected Garage"}</strong> has been sent to the PPA team.
            </p>
            
            <div style={{ textAlign: "left", background: "var(--ppa-white)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)", width: "100%", marginBottom: "var(--space-6)" }}>
              <h4 style={{ marginBottom: "var(--space-2)", fontSize: "var(--text-sm)" }}>What happens next?</h4>
              <ul style={{ paddingLeft: "var(--space-4)", color: "var(--ppa-gray-600)", fontSize: "var(--text-sm)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <li>A PPA agent will review your application {leaseType === "resident" && "and documents"}.</li>
                <li>You'll receive an SMS notification once approved.</li>
                <li>The ${price.toFixed(2)} deposit will be charged to your card.</li>
                <li>You can pick up your active access card at the garage booth!</li>
              </ul>
            </div>

            <button className="btn btn-secondary btn-full btn-lg" onClick={() => router.push("/dashboard")}>
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
