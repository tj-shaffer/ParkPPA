"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Top-right demo switcher for the ParkPGH showcase.
 *
 * Lets a visitor jump between the public landing page, the resident (consumer)
 * app, and the administrator portal — no login required. The Consumer/Admin
 * links route through /api/demo so the `demo_role` cookie is set server-side
 * before the destination renders.
 */
export function DemoSwitcher() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");
  const isConsumer = !isHome && !isAdmin;

  const base: React.CSSProperties = {
    padding: "6px 14px",
    borderRadius: "var(--radius-full)",
    fontSize: "var(--text-sm)",
    fontWeight: 600,
    textDecoration: "none",
    lineHeight: 1.4,
    transition: "background var(--transition-fast), color var(--transition-fast)",
    whiteSpace: "nowrap",
  };
  const active: React.CSSProperties = { background: "var(--ppa-navy)", color: "#fff" };
  const idle: React.CSSProperties = { background: "transparent", color: "var(--ppa-gray-600)" };

  return (
    <div
      id="demo-switcher"
      aria-label="Demo navigation"
      style={{
        position: "fixed",
        top: "var(--space-4)",
        right: "var(--space-4)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "var(--space-1)",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "5px",
        borderRadius: "var(--radius-full)",
        boxShadow: "var(--shadow-xl)",
        border: "1px solid var(--ppa-gray-200)",
      }}
    >
      <span
        style={{
          fontSize: "9px",
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ppa-gray-400)",
          padding: "0 6px 0 8px",
        }}
      >
        Demo
      </span>
      <Link href="/" style={{ ...base, ...(isHome ? active : idle) }}>
        Home
      </Link>
      <a href="/api/demo?role=consumer" style={{ ...base, ...(isConsumer ? active : idle) }}>
        Consumer
      </a>
      <a href="/api/demo?role=admin" style={{ ...base, ...(isAdmin ? active : idle) }}>
        Admin
      </a>
    </div>
  );
}
