const CAPABILITIES: {
  job: string;
  goodLooksLike: string;
  regime: "Both" | "Regulated" | "Non-regulated (on top of spec if regulated)";
}[] = [
  {
    job: "Meeting capture",
    goodLooksLike: "Transcript, summary, action items, next-agenda generation.",
    regime: "Both",
  },
  {
    job: "Status reporting",
    goodLooksLike: "Automation assembling updates from ticketing, docs, email, calendar.",
    regime: "Both",
  },
  {
    job: "Slide generation",
    goodLooksLike: "Prompt-to-deck executive slides.",
    regime: "Both",
  },
  {
    job: "Exec memo drafting",
    goodLooksLike: "Style guide from admired writers applied to a decision transcript.",
    regime: "Both",
  },
  {
    job: "Market research",
    goodLooksLike: "Deep-research returning current competitor and industry analysis.",
    regime: "Both",
  },
  {
    job: "Strategy critique",
    goodLooksLike: "Reusable skill loaded with your best practices that flags weaknesses.",
    regime: "Both",
  },
  {
    job: "Requirements elicitation",
    goodLooksLike: "Expert interviews → structured, sourced, atomic requirements.",
    regime: "Regulated",
  },
  {
    job: "Provenance & audit trail",
    goodLooksLike: "Every requirement cited; AI-drafted vs human-verified kept distinct.",
    regime: "Regulated",
  },
  {
    job: "Feedback synthesis",
    goodLooksLike: "Theme extraction across surveys/interviews, run continuously.",
    regime: "Both",
  },
  {
    job: "AI-moderated interviews",
    goodLooksLike: "A moderator that personalizes follow-ups and scales across languages.",
    regime: "Both",
  },
  {
    job: "Self-serve analytics",
    goodLooksLike: "Natural language → SQL → read-only replica → visualization.",
    regime: "Both",
  },
  {
    job: "Prototyping",
    goodLooksLike: "Prompt-to-functional-prototype, instrumented with replays and surveys.",
    regime: "Non-regulated (on top of spec if regulated)",
  },
];

const DISCUSSION_GROUPS: { heading: string; questions: string[] }[] = [
  {
    heading: "On regime and the coordination trap",
    questions: [
      "For our current roadmap, which requirements are regulatory constraints vs. experience hypotheses — and do we sort them at the requirement level today?",
      "What share of our week is coordination vs. craft, honestly, per person?",
    ],
  },
  {
    heading: "On the waterfall",
    questions: [
      "Vision: where would a Duolingo-style vision prototype have changed a stakeholder decision for us?",
      "Strategy: what is our “non-consensus and right” thesis, and what critique would an AI surface on our roadmap?",
      "Requirements: for our regulated core, who are the domain experts, and is provenance non-optional in our specs today?",
      "Design: where are we trusting stated preference over observed behavior, and where could prototypes fix that?",
      "Execution: which single comms workflow should we automate first?",
    ],
  },
  {
    heading: "On AI and the PRD",
    questions: [
      "Would our current process catch an AI-invented requirement before it reached final? If not, what gate is missing?",
      "Can we show how a given spec was produced — AI-drafted vs human-verified — if an auditor asked?",
    ],
  },
  {
    heading: "On taste and moat",
    questions: [
      "Where has our taste — not our process — made a decision right, and how do we protect it as AI raises the floor?",
      "If competitors prompt similar models, what proprietary inputs are uniquely ours?",
    ],
  },
];

function RegimeBadge({ regime }: { regime: string }) {
  const isRegulated = regime === "Regulated";
  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 99,
        whiteSpace: "nowrap",
        background: "var(--surface)",
        color: isRegulated ? "var(--warning)" : "var(--text-muted)",
        border: `1px solid ${isRegulated ? "var(--warning)" : "var(--border)"}`,
      }}
    >
      {regime}
    </span>
  );
}

export default function PlaybookPage() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Playbook Reference</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>
          Section 8 and Section 9 of{" "}
          <em>The Art of Product Management in the Age of AI</em> — the team&apos;s
          working playbook. Reference material for team facilitation; not tied to
          any entity in this app.
        </p>
      </div>

      <section className="card" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          8. Capability checklist by task
        </h2>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Tools change fast; capabilities don&apos;t. Treat this as jobs to enable,
          then pick current tools for each. The regime column notes where each
          matters most.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "8px 12px 8px 0", color: "var(--text-muted)", fontWeight: 600 }}>
                  Job to enable
                </th>
                <th style={{ padding: "8px 12px", color: "var(--text-muted)", fontWeight: 600 }}>
                  What good looks like
                </th>
                <th style={{ padding: "8px 0 8px 12px", color: "var(--text-muted)", fontWeight: 600 }}>
                  Regime
                </th>
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((row) => (
                <tr key={row.job} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 12px 10px 0", fontWeight: 600, verticalAlign: "top" }}>
                    {row.job}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--text-muted)", verticalAlign: "top" }}>
                    {row.goodLooksLike}
                  </td>
                  <td style={{ padding: "10px 0 10px 12px", verticalAlign: "top" }}>
                    <RegimeBadge regime={row.regime} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          9. Discussion questions for the team
        </h2>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
          Facilitation prompts to revisit periodically — not tracked as tasks in
          this app.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {DISCUSSION_GROUPS.map((group) => (
            <div key={group.heading}>
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--accent)",
                  marginBottom: 8,
                }}
              >
                {group.heading}
              </h3>
              <ul style={{ fontSize: 13, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                {group.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
