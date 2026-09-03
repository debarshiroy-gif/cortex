"use client";

export default function Home() {
  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
        Welcome to Cortex
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 40 }}>
        Complete your product-management loop at the same place.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {[
          {
            href: "/research",
            title: "Research",
            desc: "Extract JTBD insights from interviews",
            emoji: "🔬",
          },
          {
            href: "/research/ost",
            title: "Opportunity Tree",
            desc: "Cluster insights into solutions",
            emoji: "🌳",
          },
          {
            href: "/initiatives",
            title: "Initiatives",
            desc: "Prioritize with RICE scoring",
            emoji: "🎯",
          },
          {
            href: "/features",
            title: "Features & PRDs",
            desc: "Generate PRDs from one-liners",
            emoji: "📄",
          },
          {
            href: "/okrs",
            title: "OKRs",
            desc: "Track outcomes, not outputs",
            emoji: "📊",
          },
          {
            href: "/releases",
            title: "Releases",
            desc: "Tier-scoped launch checklists",
            emoji: "🚀",
          },
          {
            href: "/stakeholder-updates",
            title: "Stakeholder Updates",
            desc: "AI-drafted comms from live OKR data",
            emoji: "📢",
          },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{ textDecoration: "none" }}
          >
            <div
              className="card"
              style={{
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor =
                  "var(--accent)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor =
                  "var(--border)")
              }
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.emoji}</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {item.desc}
              </div>
            </div>
          </a>
        ))}
      </div>

      <div
        className="card"
        style={{ marginTop: 40, borderColor: "var(--accent)" }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          First milestone
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Create an Initiative → score it with RICE → generate a PRD → export
          as markdown. That loop is live and ready.
        </p>
      </div>
    </div>
  );
}
