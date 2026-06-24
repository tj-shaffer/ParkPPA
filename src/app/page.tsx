import Link from "next/link";
import styles from "./landing.module.css";

/**
 * Public landing page for the ParkPGH showcase.
 * Two-column hero: concept copy + entry points on the left, an app mockup on
 * the right. Visitors enter either side of the demo via /api/demo (no login).
 */
export default function HomePage() {
  return (
    <main className={styles.hero}>
      <div className={styles.orb + " " + styles.orbA} />
      <div className={styles.orb + " " + styles.orbB} />
      <div className={styles.orb + " " + styles.orbC} />
      <div className={styles.grid} />

      <div className={styles.container}>
        <header className={styles.brand}>
          <span className={styles.brandMark}>P</span>
          <span className={styles.brandName}>ParkPGH</span>
          <span className={styles.brandTag}>Second 9 Labs · Concept</span>
        </header>

        <div className={styles.heroGrid}>
          {/* Copy */}
          <div>
            <span className={styles.eyebrow}>
              <span className={styles.dot} /> Live demo · no login required
            </span>

            <h1 className={styles.title}>
              Monthly garage leasing,
              <br />
              <span className={styles.accent}>reimagined</span> as a consumer app.
            </h1>

            <p className={styles.lede}>
              A concept portal for the Pittsburgh Parking Authority.{" "}
              <strong>Residents</strong> lease a spot, pay rent, set up autopay, and get renewal
              reminders. <strong>Administrators</strong> review applications and track occupancy and
              revenue across every garage.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/api/demo?role=consumer" className={styles.btnPrimary}>
                Open the resident app →
              </Link>
              <Link href="/api/demo?role=admin" className={styles.btnGhost}>
                View the admin portal
              </Link>
            </div>

            <div className={styles.chips}>
              <span className={styles.chip}>Autopay</span>
              <span className={styles.chip}>Renewal reminders</span>
              <span className={styles.chip}>Applications</span>
              <span className={styles.chip}>Revenue analytics</span>
            </div>
          </div>

          {/* App mockup */}
          <div className={styles.art}>
            <PhoneMockup />

            <div className={`${styles.floatCard} ${styles.floatRevenue}`}>
              <div className={styles.fcLabel}>Revenue · MTD</div>
              <div className={styles.fcValue}>$248,500</div>
              <div className={styles.fcTrend}>▲ 4.2% vs last month</div>
              <div className={styles.fcBars}>
                <span style={{ height: "40%" }} />
                <span style={{ height: "62%" }} />
                <span style={{ height: "50%" }} />
                <span style={{ height: "80%" }} />
                <span style={{ height: "70%" }} />
                <span style={{ height: "100%" }} />
              </div>
            </div>

            <div className={`${styles.floatCard} ${styles.floatOccupancy}`}>
              <div className={styles.fcLabel}>Occupancy</div>
              <div className={styles.fcValue}>86%</div>
              <div className={styles.fcTrend}>11 garages live</div>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        A <strong>Second 9 Labs</strong> concept — an idea and its implementation. Sample data only.
      </footer>
    </main>
  );
}

/** Stylized phone showing the resident dashboard. */
function PhoneMockup() {
  return (
    <svg
      className={styles.phone}
      width="290"
      height="560"
      viewBox="0 0 290 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ParkPGH resident app preview"
    >
      <defs>
        <clipPath id="screen">
          <rect x="22" y="20" width="246" height="520" rx="32" />
        </clipPath>
        <linearGradient id="balance" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e0233f" />
          <stop offset="1" stopColor="#1b2a4a" />
        </linearGradient>
      </defs>

      {/* frame */}
      <rect x="10" y="8" width="270" height="544" rx="42" fill="#0e1730" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

      <g clipPath="url(#screen)">
        <rect x="22" y="20" width="246" height="520" fill="#eef1f6" />

        {/* header */}
        <rect x="22" y="20" width="246" height="96" fill="#1b2a4a" />
        <text x="42" y="58" fill="#8fa6cf" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600" letterSpacing="0.5">
          GOOD MORNING
        </text>
        <text x="42" y="84" fill="#ffffff" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="800">
          Hi, Tony
        </text>
        <circle cx="240" cy="68" r="16" fill="rgba(255,255,255,0.14)" />
        <text x="240" y="73" textAnchor="middle" fill="#fff" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="700">TS</text>

        {/* balance card */}
        <rect x="42" y="136" width="206" height="118" rx="18" fill="url(#balance)" />
        <text x="62" y="166" fill="rgba(255,255,255,0.75)" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600">
          Amount due · May 1
        </text>
        <text x="62" y="200" fill="#fff" fontFamily="Inter, sans-serif" fontSize="30" fontWeight="800">$175.00</text>
        <rect x="62" y="214" width="92" height="28" rx="14" fill="#ffffff" />
        <text x="108" y="232" textAnchor="middle" fill="#c8102e" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="700">Pay now</text>

        {/* row: garage */}
        <rect x="42" y="272" width="206" height="58" rx="14" fill="#ffffff" />
        <rect x="56" y="288" width="26" height="26" rx="7" fill="#e8ebf0" />
        <text x="94" y="298" fill="#1b2a4a" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">Smithfield-Liberty</text>
        <text x="94" y="316" fill="#8c95a6" fontFamily="Inter, sans-serif" fontSize="11">Spot B-247 · 24hr</text>

        {/* row: autopay */}
        <rect x="42" y="342" width="206" height="58" rx="14" fill="#ffffff" />
        <rect x="56" y="358" width="26" height="26" rx="7" fill="#e8ebf0" />
        <text x="94" y="368" fill="#1b2a4a" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">Autopay</text>
        <text x="94" y="386" fill="#8c95a6" fontFamily="Inter, sans-serif" fontSize="11">Visa ·· 4242</text>
        <rect x="206" y="362" width="30" height="18" rx="9" fill="#d1fae5" />
        <circle cx="227" cy="371" r="7" fill="#10b981" />

        {/* row: reminder */}
        <rect x="42" y="412" width="206" height="44" rx="14" fill="#fef3c7" />
        <text x="60" y="439" fill="#b45309" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="600">
          Renewal reminder sent · 30 days
        </text>

        {/* bottom nav */}
        <rect x="22" y="496" width="246" height="44" fill="#ffffff" />
        <circle cx="74" cy="518" r="5" fill="#1b2a4a" />
        <circle cx="129" cy="518" r="5" fill="#c3c9d4" />
        <circle cx="184" cy="518" r="5" fill="#c3c9d4" />
        <circle cx="239" cy="518" r="5" fill="#c3c9d4" />
      </g>
    </svg>
  );
}
