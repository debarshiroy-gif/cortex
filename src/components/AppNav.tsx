"use client";

import { usePathname } from "next/navigation";

// The public A/B-test session page (/test/[token]) is reachable by anyone
// with the link and has no auth. Cortex has no auth anywhere, so if this nav
// rendered there, a tester could click through to real initiatives/BRDs.
// Rendering nothing on that path keeps the public page fully isolated.

const LINKS = [
  { href: "/initiatives", label: "Initiatives" },
  { href: "/research", label: "Research" },
  { href: "/meeting-notes", label: "Meeting Notes" },
  { href: "/brd", label: "BRD" },
  { href: "/prototype", label: "Prototype" },
  { href: "/prd", label: "PRD" },
  { href: "/okrs", label: "OKRs" },
  { href: "/features", label: "Features" },
  { href: "/releases", label: "Releases" },
  { href: "/stakeholder-updates", label: "Updates" },
  { href: "/playbook", label: "Playbook" },
];

export function AppNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/test/")) return null;

  return (
    <div>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "12px 24px",
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
        {LINKS.map(({ href, label }) => {
          const active = pathname?.startsWith(href);
          return (
            <a
              key={href}
              href={href}
              style={{
                color: active ? "var(--success)" : "var(--text-muted)",
                fontWeight: active ? 600 : 400,
              }}
            >
              {label}
            </a>
          );
        })}
      </nav>
      <div
        style={{
          height: 3,
          background:
            "linear-gradient(90deg, var(--accent) 0%, var(--accent) 55%, var(--success) 100%)",
        }}
      />
    </div>
  );
}
