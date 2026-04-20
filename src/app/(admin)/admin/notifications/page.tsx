"use client";

import { useState, useEffect } from "react";
import { formatDate, cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons/Icon";
import styles from "./notifications.module.css";

interface NotificationData {
  id: string;
  type: string;
  channel: string;
  content: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

function typeLabel(type: string): { label: string; icon: IconName } {
  const map: Record<string, { label: string; icon: IconName }> = {
    PAYMENT_DUE: { label: "Payment Due", icon: "calendar" },
    PAST_DUE: { label: "Past Due", icon: "alert-triangle" },
    PAYMENT_CONFIRM: { label: "Confirmation", icon: "check-circle" },
    LEASE_EXPIRY: { label: "Lease Expiry", icon: "clipboard" },
    WELCOME: { label: "Welcome", icon: "wave" },
    CUSTOM: { label: "Custom", icon: "megaphone" },
    RATE_CHANGE: { label: "Rate Change", icon: "dollar-sign" },
    CLOSURE: { label: "Closure", icon: "construction" },
  };
  return map[type] || { label: type, icon: "send" };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMessage, setComposeMessage] = useState("");
  const [composeChannel, setComposeChannel] = useState<"SMS" | "EMAIL" | "BOTH">("SMS");
  const [composeRecipients, setComposeRecipients] = useState("all");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!composeMessage.trim()) return;
    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: composeMessage,
          channel: composeChannel,
          recipientType: composeRecipients,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSendResult(`Sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}${data.failed > 0 ? `, ${data.failed} failed` : ""}`);
        setComposeMessage("");
        // Refresh the notification log
        fetchNotifications();
      } else {
        setSendResult(`Error: ${data.error}`);
      }
    } catch {
      setSendResult("Network error");
    } finally {
      setSending(false);
    }
  }

  const sentCount = notifications.filter((n) => n.status === "SENT").length;
  const failedCount = notifications.filter((n) => n.status === "FAILED").length;
  const deliveryRate = notifications.length > 0
    ? ((sentCount / notifications.length) * 100).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.pageTitle}>
          <div><h1>Notifications</h1><p>Loading...</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageTitle}>
        <div>
          <h1>Notifications</h1>
          <p>Notification log and compose</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setComposeOpen(!composeOpen)}
          id="btn-compose"
        >
          <Icon name="megaphone" size={16} /> Compose Message
        </button>
      </div>

      {/* Compose Panel */}
      {composeOpen && (
        <div className={cn("card", styles.composeCard)}>
          <div className="card-header">
            <div className="card-title">Compose Notification</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setComposeOpen(false)}><Icon name="x" size={16} /></button>
          </div>
          <div className={styles.composeForm}>
            <div className="input-group">
              <label className="input-label">Recipients</label>
              <select className="input" id="compose-recipients" value={composeRecipients} onChange={(e) => setComposeRecipients(e.target.value)}>
                <option value="all">All Tenants</option>
                <option value="past_due">Past Due Tenants</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Channel</label>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <button className={cn("btn btn-sm", composeChannel === "SMS" ? "btn-secondary" : "btn-outline")} onClick={() => setComposeChannel("SMS")}><Icon name="smartphone" size={14} /> SMS</button>
                <button className={cn("btn btn-sm", composeChannel === "BOTH" ? "btn-secondary" : "btn-outline")} onClick={() => setComposeChannel("BOTH")}><Icon name="mail" size={14} /><Icon name="smartphone" size={14} /> Both</button>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Message</label>
              <textarea
                className="input"
                rows={4}
                placeholder="Type your message..."
                id="compose-message"
                style={{ resize: "vertical" }}
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
              />
            </div>
            {sendResult && (
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{sendResult}</div>
            )}
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setComposeOpen(false)}>Cancel</button>
              <button className="btn btn-primary" id="btn-send-notification" disabled={sending || !composeMessage.trim()} onClick={handleSend}>
                {sending ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className="stat-card">
          <div className="stat-card-label">Total Sent</div>
          <div className="stat-card-value">{sentCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Delivery Rate</div>
          <div className="stat-card-value">{deliveryRate}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Failed</div>
          <div className="stat-card-value" style={{ color: "var(--color-danger)" }}>{failedCount}</div>
        </div>
      </div>

      {/* Log */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "var(--space-5) var(--space-5) 0" }}>
          <div className="card-title">Recent Activity</div>
        </div>
        <table className="data-table" style={{ marginTop: "var(--space-3)" }}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Recipient</th>
              <th>Channel</th>
              <th>Message</th>
              <th>Status</th>
              <th>Sent</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => {
              const t = typeLabel(n.type);
              return (
                <tr key={n.id}>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span><Icon name={t.icon} size={16} /></span>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-xs)" }}>{t.label}</span>
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--ppa-navy)", fontSize: "var(--text-sm)" }}>
                      {n.user.firstName} {n.user.lastName}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ppa-gray-400)" }}>
                      {n.channel === "SMS" ? n.user.phone : n.user.email}
                    </div>
                  </td>
                  <td>
                    <span className={cn("badge", n.channel === "SMS" ? "badge-info" : "badge-neutral")}>
                      {n.channel}
                    </span>
                  </td>
                  <td style={{ maxWidth: "300px", fontSize: "var(--text-xs)", color: "var(--ppa-gray-600)" }}>
                    {n.content}
                  </td>
                  <td>
                    <span className={cn("badge", n.status === "SENT" ? "badge-success" : n.status === "FAILED" ? "badge-danger" : "badge-warning")}>
                      <span className="badge-dot" />
                      {n.status === "SENT" ? "Sent" : n.status === "FAILED" ? "Failed" : "Pending"}
                    </span>
                  </td>
                  <td style={{ fontSize: "var(--text-xs)", color: "var(--ppa-gray-400)", whiteSpace: "nowrap" }}>
                    {n.sentAt ? formatDate(n.sentAt, "short") : formatDate(n.createdAt, "short")}
                  </td>
                </tr>
              );
            })}
            {notifications.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--ppa-gray-400)" }}>
                  No notifications sent yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
