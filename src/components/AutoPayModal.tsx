"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Icon } from "@/components/icons/Icon";
import styles from "./PaymentModal.module.css";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

// ─── Card Element Styling ───────────────────────────────────────────────────

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#1F2937",
      "::placeholder": { color: "#8C95A6" },
      iconColor: "#4A6FA5",
    },
    invalid: {
      color: "#C8102E",
      iconColor: "#C8102E",
    },
  },
  hidePostalCode: false,
};

// ─── Inner Form (inside Elements provider) ──────────────────────────────────

function SetupForm({
  clientSecret,
  leaseId,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  leaseId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setProcessing(true);
    setError("");

    const { error: submitError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (submitError) {
      setError(submitError.message || "Setup failed. Please try again.");
      setProcessing(false);
    } else {
      // Save card details to our database immediately
      try {
        await fetch("/api/payments/methods/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            setupIntentId: setupIntent?.id,
            leaseId,
          }),
        });
      } catch (err) {
        console.error("Failed to confirm payment method locally:", err);
      }
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.amount}>
        <span className={styles.amountLabel}>Save Payment Method</span>
        <span className={styles.amountValue} style={{ fontSize: 'var(--text-lg)' }}>$0.00 today</span>
      </div>
      <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginTop: '-12px' }}>
        Store a card securely for future payments. No charge today.
      </p>

      <div className={styles.stripeElement}>
        <div className={styles.cardLabel}>Card Details</div>
        <div className={styles.cardInputWrapper}>
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!stripe || processing}
          id="btn-confirm-setup"
        >
          {processing ? (
            <span className={styles.spinner} />
          ) : (
            "Save Card"
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

// ─── Modal ──────────────────────────────────────────────────────────────────

export default function AutoPayModal({
  leaseId,
  garageName,
  onClose,
  onSuccess,
}: {
  leaseId?: string;
  garageName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [view, setView] = useState<"list" | "add">("list");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Fetch saved cards on mount
  useEffect(() => {
    async function loadCards() {
      try {
        const res = await fetch("/api/payments/methods");
        if (res.ok) {
          const data = await res.json();
          setSavedCards(data.methods || []);
          if (!data.methods || data.methods.length === 0) {
            setView("add");
          }
        }
      } catch (err) {
        console.error("Failed to load methods:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCards();
  }, []);

  // Create SetupIntent lazily when switching to "add" view
  useEffect(() => {
    if (view !== "add" || clientSecret) return;

    async function createIntent() {
      try {
        const res = await fetch("/api/payments/setup-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId }),
        });
        const data = await res.json();
        if (res.ok) {
          setClientSecret(data.clientSecret);
        } else {
          console.error("Setup-intent error:", data.error);
          setError(data.error || "Failed to initialize card setup.");
        }
      } catch {
        setError("Network error. Please try again.");
      }
    }
    createIntent();
  }, [view, clientSecret, leaseId]);

  const handleSuccess = useCallback(() => {
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1500);
  }, [onSuccess, onClose]);

  const handleRemoveCard = async (paymentMethodId: string) => {
    if (removingId) return;
    setRemovingId(paymentMethodId);

    try {
      const res = await fetch("/api/payments/methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });
      if (res.ok) {
        setSavedCards((prev) => prev.filter((c) => c.id !== paymentMethodId));
      }
    } catch (err) {
      console.error("Failed to remove card:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const formatBrand = (brand: string) => {
    const brands: Record<string, string> = {
      visa: "Visa", mastercard: "Mastercard", amex: "Amex",
      discover: "Discover", diners: "Diners Club", jcb: "JCB",
    };
    return brands[brand.toLowerCase()] || brand;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.headerTitle}>
              {view === "add" && savedCards.length > 0 ? "Add New Card" : "Payment Methods"}
            </div>
            <div className={styles.headerSub}>{garageName}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        {/* Content */}
        {success ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}><Icon name="check-circle" size={48} style={{ color: "var(--color-success)" }} /></div>
            <div className={styles.successTitle}>Card Saved!</div>
            <div className={styles.successSub}>
              Your payment method has been securely saved.
            </div>
          </div>
        ) : loading ? (
          <div className={styles.loadingState}>
            <span className={styles.spinner} />
            <span>Loading payment methods...</span>
          </div>
        ) : error && view !== "list" ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}><Icon name="alert-triangle" size={32} style={{ color: "var(--color-warning)" }} /></div>
            <div>{error}</div>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        ) : view === "list" && savedCards.length > 0 ? (
          <div className={styles.form}>
            {/* Saved cards list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {savedCards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    padding: "var(--space-3) var(--space-4)",
                    background: "var(--ppa-gray-50)",
                    borderRadius: "var(--radius-md)",
                    border: card.isDefault ? "1.5px solid var(--color-success)" : "1.5px solid transparent",
                  }}
                >
                  <Icon name="credit-card" size={20} style={{ color: "var(--ppa-blue-mid)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ppa-navy)" }}>
                      {formatBrand(card.brand)} •••• {card.last4}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ppa-gray-400)" }}>
                      Expires {String(card.expMonth).padStart(2, "0")}/{String(card.expYear).slice(-2)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    {card.isDefault && (
                      <span className="badge badge-success" style={{ fontSize: "9px" }}>
                        <span className="badge-dot" />
                        Default
                      </span>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--ppa-gray-400)", padding: "var(--space-1)" }}
                      onClick={() => handleRemoveCard(card.id)}
                      disabled={removingId === card.id}
                      aria-label={`Remove ${formatBrand(card.brand)} card`}
                    >
                      {removingId === card.id ? "..." : <Icon name="x" size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-outline btn-full"
              onClick={() => setView("add")}
              style={{ marginTop: "var(--space-2)" }}
            >
              <Icon name="credit-card" size={16} /> Add New Card
            </button>
          </div>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#1B2A4A",
                  colorDanger: "#C8102E",
                  fontFamily: "Inter, system-ui, sans-serif",
                  borderRadius: "8px",
                },
              },
            }}
          >
            <SetupForm
              clientSecret={clientSecret}
              leaseId={leaseId}
              onSuccess={handleSuccess}
              onCancel={savedCards.length > 0 ? () => { setView("list"); setError(""); } : onClose}
            />
          </Elements>
        ) : error ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}><Icon name="alert-triangle" size={32} style={{ color: "var(--color-warning)" }} /></div>
            <div>{error}</div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              {savedCards.length > 0 && (
                <button className="btn btn-outline" onClick={() => { setView("list"); setError(""); }}>
                  Back to Cards
                </button>
              )}
              <button className="btn btn-outline" onClick={() => { setError(""); setClientSecret(null); }}>
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.loadingState}>
            <span className={styles.spinner} />
            <span>Initializing secure session...</span>
          </div>
        )}

        {/* Test mode hint */}
        {!success && !error && view === "add" && (
          <div className={styles.testHint}>
            <Icon name="flask" size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Test mode — use card <code>4242 4242 4242 4242</code>
          </div>
        )}
      </div>
    </div>
  );
}
