"use client";

import { usePathname } from "next/navigation";

// The public A/B-test session page (/test/[token]) is reachable by anyone
// with the link and has no auth. Cortex has no auth anywhere, so if this nav
// rendered there, a tester could click through to real initiatives/BRDs.
// Rendering nothing on that path keeps the public page fully isolated.

export function AppNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/test/")) return null;

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "12px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <a
        href="/"
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: "var(--accent)",
          textDecoration: "none",
        }}
      >
        Cortex
      </a>
      <a href="/initiatives" style={{ color: "var(--text-muted)" }}>
        Initiatives
      </a>
      <a href="/research" style={{ color: "var(--text-muted)" }}>
        Research
      </a>
      <a href="/meeting-notes" style={{ color: "var(--text-muted)" }}>
        Meeting Notes
      </a>
      <a href="/brd" style={{ color: "var(--text-muted)" }}>
        BRD
      </a>
      <a href="/prototype" style={{ color: "var(--text-muted)" }}>
        Prototype
      </a>
      <a href="/prd" style={{ color: "var(--text-muted)" }}>
        PRD
      </a>
      <a href="/okrs" style={{ color: "var(--text-muted)" }}>
        OKRs
      </a>
      <a href="/features" style={{ color: "var(--text-muted)" }}>
        Features
      </a>
      <a href="/releases" style={{ color: "var(--text-muted)" }}>
        Releases
      </a>
      <a href="/stakeholder-updates" style={{ color: "var(--text-muted)" }}>
        Updates
      </a>
      <a href="/playbook" style={{ color: "var(--text-muted)" }}>
        Playbook
      </a>
    </nav>
  );
}
