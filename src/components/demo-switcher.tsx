"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons/Icon";

export function DemoSwitcher() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  // Toggle global class to reveal/hide Stripe badge + Next.js indicator
  const toggleDrawer = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      document.body.classList.add("dev-tools-open");
    } else {
      document.body.classList.remove("dev-tools-open");
    }
  };

  return (
    <div
      id="demo-drawer"
      style={{
        position: "fixed",
        top: "var(--space-4)",
        right: "var(--space-4)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      <button
        onClick={toggleDrawer}
        style={{
          width: "44px",
          height: "44px",
          background: "transparent",
          color: "rgba(255, 255, 255, 0.9)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all var(--transition-fast)",
        }}
        onMouseOver={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 1)")}
        onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)")}
      >
        <Icon name={isOpen ? "x" : "menu"} size={20} />
      </button>

      {isOpen && (
        <div
          className="stagger-in"
          style={{
            position: "absolute",
            top: "56px",
            right: 0,
            background: "var(--ppa-white)",
            boxShadow: "var(--shadow-xl)",
            padding: "var(--space-3)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
            width: "220px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--ppa-gray-200)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--ppa-gray-400)",
              paddingBottom: "var(--space-2)",
              borderBottom: "1px solid var(--ppa-gray-100)",
              marginBottom: "var(--space-1)",
            }}
          >
            Demo Navigation
          </div>
          <Link
            href="/dashboard"
            className="btn btn-sm"
            style={{
              justifyContent: "flex-start",
              background: !isAdmin && pathname !== "/login" ? "var(--ppa-navy)" : "transparent",
              color: !isAdmin && pathname !== "/login" ? "white" : "var(--ppa-gray-600)",
              width: "100%",
            }}
            onClick={toggleDrawer}
          >
            <Icon name="smartphone" size={14} /> Consumer
          </Link>
          <Link
            href="/admin"
            className="btn btn-sm"
            style={{
              justifyContent: "flex-start",
              background: isAdmin ? "var(--ppa-navy)" : "transparent",
              color: isAdmin ? "white" : "var(--ppa-gray-600)",
              width: "100%",
            }}
            onClick={toggleDrawer}
          >
            <Icon name="monitor" size={14} /> Admin
          </Link>
          <Link
            href="/login"
            className="btn btn-sm"
            style={{
              justifyContent: "flex-start",
              background: pathname === "/login" ? "var(--ppa-navy)" : "transparent",
              color: pathname === "/login" ? "white" : "var(--ppa-gray-600)",
              width: "100%",
            }}
            onClick={toggleDrawer}
          >
            <Icon name="key" size={14} /> Login Flow
          </Link>

          <div style={{
            fontSize: "9px",
            color: "var(--ppa-gray-400)",
            lineHeight: 1.2,
            marginTop: "var(--space-2)",
            padding: "var(--space-2)",
            background: "var(--ppa-gray-50)",
            borderRadius: "var(--radius-sm)"
          }}>
            External dev tools (Stripe, Next.js) are now visible.
          </div>
        </div>
      )}
    </div>
  );
}
