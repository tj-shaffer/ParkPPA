import Link from "next/link";

/**
 * Public landing page for the ParkPGH showcase.
 * Describes the concept and routes visitors into either the resident app or
 * the admin portal via the demo role switcher (/api/demo).
 */

const ctaCard: React.CSSProperties = {
  display: "block",
  background: "rgba(255, 255, 255, 0.07)",
  border: "1px solid rgba(255, 255, 255, 0.16)",
  borderRadius: "var(--radius-xl)",
  padding: "var(--space-5)",
  textDecoration: "none",
  color: "#fff",
};
const ctaKicker: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--ppa-blue-pale)",
  marginBottom: "var(--space-2)",
};
const ctaTitle: React.CSSProperties = {
  fontSize: "var(--text-lg)",
  fontWeight: 700,
  marginBottom: "var(--space-1)",
};
const ctaSub: React.CSSProperties = {
  fontSize: "var(--text-sm)",
  color: "var(--ppa-blue-pale)",
  lineHeight: 1.5,
};

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background:
          "linear-gradient(160deg, var(--ppa-navy) 0%, var(--ppa-navy-hero) 55%, var(--ppa-blue-mid) 135%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--space-12) var(--space-5)",
        }}
      >
        <div style={{ width: "100%", maxWidth: "880px", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "var(--space-6)",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="11" fill="rgba(255,255,255,0.14)" />
              <text
                x="20"
                y="27"
                textAnchor="middle"
                fill="#fff"
                fontFamily="Inter, sans-serif"
                fontWeight="800"
                fontSize="20"
              >
                P
              </text>
            </svg>
            <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, letterSpacing: "-0.02em" }}>
              ParkPGH
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, var(--text-4xl))",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Monthly garage leasing,
            <br />
            reimagined as a consumer app.
          </h1>

          <p
            style={{
              fontSize: "var(--text-lg)",
              lineHeight: 1.6,
              color: "var(--ppa-blue-pale)",
              maxWidth: "640px",
              margin: "var(--space-5) auto 0",
            }}
          >
            A concept portal for the Pittsburgh Parking Authority.{" "}
            <strong style={{ color: "#fff" }}>Residents</strong> lease a monthly garage spot, pay
            rent, set up autopay, and get renewal &amp; past-due reminders.{" "}
            <strong style={{ color: "#fff" }}>Administrators</strong> review applications, track
            occupancy and revenue across garages, and message lease-holders.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "var(--space-4)",
              marginTop: "var(--space-8)",
              textAlign: "left",
            }}
          >
            <Link href="/api/demo?role=consumer" style={ctaCard}>
              <div style={ctaKicker}>For residents</div>
              <div style={ctaTitle}>Explore the resident app →</div>
              <div style={ctaSub}>Dashboard, lease details, payments &amp; autopay.</div>
            </Link>
            <Link href="/api/demo?role=admin" style={ctaCard}>
              <div style={ctaKicker}>For staff</div>
              <div style={ctaTitle}>Explore the admin portal →</div>
              <div style={ctaSub}>Applications, garages, leases, revenue &amp; notifications.</div>
            </Link>
          </div>

          <p
            style={{
              marginTop: "var(--space-6)",
              fontSize: "var(--text-sm)",
              color: "var(--ppa-blue-light)",
            }}
          >
            Interactive demo · sample data · no login required
          </p>
        </div>
      </div>

      <footer
        style={{
          textAlign: "center",
          padding: "var(--space-5)",
          fontSize: "var(--text-sm)",
          color: "var(--ppa-blue-light)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        A <strong style={{ color: "#fff" }}>Second 9 Labs</strong> concept — an idea and its
        implementation.
      </footer>
    </main>
  );
}
