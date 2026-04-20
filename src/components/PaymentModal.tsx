"use client";

import { useState } from "react";
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

// ─── Inner Form (inside Elements provider) ──────────────────────────────────

function CheckoutForm({
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
      <div className={styles.amount}>
        <span className={styles.amountLabel}>Amount Due</span>
        <span className={styles.amountValue}>{formatCurrency(amount)}</span>
      </div>

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

// ─── Modal Wrapper ──────────────────────────────────────────────────────────

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

  // Create PaymentIntent on mount
  useState(() => {
    async function createIntent() {
      try {
        const res = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to initialize payment.");
          setLoading(false);
          return;
        }

        setClientSecret(data.clientSecret);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    createIntent();
  });

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1500);
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
              You&apos;ll receive a confirmation SMS shortly.
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
            <button className="btn btn-outline" onClick={onClose}>Close</button>
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
            <CheckoutForm
              amount={amount}
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </Elements>
        ) : null}

        {/* Test mode hint */}
        {!success && !error && (
          <div className={styles.testHint}>
            <Icon name="flask" size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Test mode — use card <code>4242 4242 4242 4242</code>
          </div>
        )}
      </div>
    </div>
  );
}
