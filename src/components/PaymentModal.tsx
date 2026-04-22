"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { formatCurrency } from "@/lib/utils";
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

// ─── New Card Form ──────────────────────────────────────────────────────────

function NewCardForm({
  amount,
  clientSecret,
  onSuccess,
  onCancel,
}: {
  amount: number;
  clientSecret: string;
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

    const { error: submitError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (submitError) {
      setError(submitError.message || "Payment failed. Please try again.");
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
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
          Back
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!stripe || processing}
          id="btn-confirm-payment"
        >
          {processing ? (
            <span className={styles.spinner} />
          ) : (
            `Pay ${formatCurrency(amount)}`
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────────────

export default function PaymentModal({
  paymentId,
  amount,
  garageName,
  onClose,
  onSuccess,
}: {
  paymentId: string;
  amount: number;
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
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [payingWithSaved, setPayingWithSaved] = useState(false);
  const [view, setView] = useState<"select" | "new-card">("select");

  // Initialize: fetch saved cards + create PaymentIntent
  useEffect(() => {
    async function init() {
      try {
        // Fetch saved cards and create payment intent in parallel
        const [cardsRes, intentRes] = await Promise.all([
          fetch("/api/payments/methods"),
          fetch("/api/payments/create-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          }),
        ]);

        if (cardsRes.ok) {
          const cardsData = await cardsRes.json();
          const cards = cardsData.methods || [];
          setSavedCards(cards);
          // Pre-select the default card
          const defaultCard = cards.find((c: SavedCard) => c.isDefault);
          if (defaultCard) setSelectedCard(defaultCard.id);
          else if (cards.length > 0) setSelectedCard(cards[0].id);
          // If no saved cards, go straight to new card entry
          if (cards.length === 0) setView("new-card");
        }

        if (intentRes.ok) {
          const intentData = await intentRes.json();
          setClientSecret(intentData.clientSecret);
        } else {
          const data = await intentRes.json();
          setError(data.error || "Failed to initialize payment.");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [paymentId]);

  const handleSuccess = useCallback(() => {
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1500);
  }, [onSuccess, onClose]);

  // Pay with a saved card
  const handlePayWithSaved = async () => {
    if (!selectedCard || !clientSecret) return;
    setPayingWithSaved(true);

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe not loaded");

      const { error: payError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: selectedCard,
      });

      if (payError) {
        setError(payError.message || "Payment failed. Please try again.");
        setPayingWithSaved(false);
      } else {
        handleSuccess();
      }
    } catch (err) {
      setError("Payment failed. Please try again.");
      setPayingWithSaved(false);
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
            <div className={styles.headerTitle}>Make a Payment</div>
            <div className={styles.headerSub}>{garageName}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        {/* Content */}
        {success ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}><Icon name="check-circle" size={48} style={{ color: "var(--color-success)" }} /></div>
            <div className={styles.successTitle}>Payment Successful!</div>
            <div className={styles.successSub}>
              You&apos;ll receive a confirmation shortly.
            </div>
          </div>
        ) : loading ? (
          <div className={styles.loadingState}>
            <span className={styles.spinner} />
            <span>Initializing secure payment...</span>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}><Icon name="alert-triangle" size={32} style={{ color: "var(--color-warning)" }} /></div>
            <div>{error}</div>
            <button className="btn btn-outline" onClick={() => setError("")}>Try Again</button>
          </div>
        ) : view === "select" && savedCards.length > 0 ? (
          /* ── Saved Card Selection ───────────────────────────────────── */
          <div className={styles.form}>
            {/* Amount */}
            <div className={styles.amount}>
              <span className={styles.amountLabel}>Amount Due</span>
              <span className={styles.amountValue}>{formatCurrency(amount)}</span>
            </div>

            {/* Card selection */}
            <div>
              <div className={styles.cardLabel}>Select Payment Method</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {savedCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCard(card.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      padding: "var(--space-3) var(--space-4)",
                      background: selectedCard === card.id ? "var(--color-info-light)" : "var(--ppa-gray-50)",
                      borderRadius: "var(--radius-md)",
                      border: selectedCard === card.id ? "1.5px solid var(--ppa-blue-mid)" : "1.5px solid var(--ppa-gray-200)",
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                      fontFamily: "var(--font-sans)",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <Icon name="credit-card" size={20}
                      style={{ color: selectedCard === card.id ? "var(--ppa-blue-mid)" : "var(--ppa-gray-400)", flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ppa-navy)" }}>
                        {formatBrand(card.brand)} •••• {card.last4}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--ppa-gray-400)" }}>
                        Expires {String(card.expMonth).padStart(2, "0")}/{String(card.expYear).slice(-2)}
                      </div>
                    </div>
                    {selectedCard === card.id && (
                      <Icon name="check-circle" size={18} style={{ color: "var(--ppa-blue-mid)", flexShrink: 0 }} />
                    )}
                  </button>
                ))}

                {/* Add New Card option */}
                <button
                  type="button"
                  onClick={() => setView("new-card")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    padding: "var(--space-3) var(--space-4)",
                    background: "transparent",
                    borderRadius: "var(--radius-md)",
                    border: "1.5px dashed var(--ppa-gray-200)",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    fontFamily: "var(--font-sans)",
                    color: "var(--ppa-gray-500)",
                    fontSize: "var(--text-sm)",
                    fontWeight: 500,
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <Icon name="credit-card" size={18} />
                  Use a different card
                </button>
              </div>
            </div>

            {/* Pay button */}
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePayWithSaved}
                disabled={!selectedCard || payingWithSaved}
                id="btn-confirm-payment"
              >
                {payingWithSaved ? (
                  <span className={styles.spinner} />
                ) : (
                  `Pay ${formatCurrency(amount)}`
                )}
              </button>
            </div>
          </div>
        ) : clientSecret ? (
          /* ── New Card Entry ─────────────────────────────────────────── */
          <>
            <div className={styles.form} style={{ paddingBottom: 0 }}>
              <div className={styles.amount}>
                <span className={styles.amountLabel}>Amount Due</span>
                <span className={styles.amountValue}>{formatCurrency(amount)}</span>
              </div>
            </div>
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
              <NewCardForm
                amount={amount}
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onCancel={savedCards.length > 0 ? () => setView("select") : onClose}
              />
            </Elements>
          </>
        ) : null}

        {/* Test mode hint */}
        {!success && !error && view === "new-card" && (
          <div className={styles.testHint}>
            <Icon name="flask" size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Test mode — use card <code>4242 4242 4242 4242</code>
          </div>
        )}
      </div>
    </div>
  );
}
