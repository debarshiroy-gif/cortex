"use client";

import { useEffect, useState } from "react";

const PRODUCT_ID = "seed-product";

type InsightChip = {
  id: string;
  summary: string;
  tags: string[];
  confidence: string;
  personaName: string;
};

type Solution = {
  id: string;
  title: string;
  rationale: string;
  experiment: string;
};

type Opportunity = {
  id: string;
  label: string;
  insightIds: string[];
  insights: InsightChip[];
  solutions: Solution[];
};

type OKR = { id: string; objective: string; quarter: string };

const CONF_COLOR: Record<string, string> = {
  high: "var(--success)",
  med: "var(--warning)",
  low: "var(--danger)",
};

const TYPE_COLOR: Record<string, string> = {
  functional: "#7c6af7",
  emotional: "#f472b6",
  social: "#34d399",
  jtbd: "#94a3b8",
};

function InsightPill({ ins }: { ins: InsightChip }) {
  const [open, setOpen] = useState(false);
  const type = ins.tags.find((t) =>
    ["functional", "emotional", "social"].includes(t)
  );
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "var(--surface-2)",
          border: `1px solid ${type ? TYPE_COLOR[type] : "var(--border)"}`,
          borderRadius: 99,
          padding: "3px 10px",
          fontSize: 11,
          color: type ? TYPE_COLOR[type] : "var(--text-muted)",
          cursor: "pointer",
          maxWidth: 220,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={ins.summary}
      >
        {type ?? "insight"} · {ins.personaName}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 10,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 12,
            fontSize: 12,
            width: 280,
            lineHeight: 1.6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ marginBottom: 6 }}>{ins.summary}</div>
          <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
            Confidence:{" "}
            <span style={{ color: CONF_COLOR[ins.confidence] }}>
              {ins.confidence}
            </span>{" "}
            · {ins.personaName}
          </div>
          <button
            style={{
              position: "absolute",
              top: 6,
              right: 8,
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 14,
            }}
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function SolutionCard({
  solution,
  opportunity,
  onPromote,
}: {
  solution: Solution;
  opportunity: Opportunity;
  onPromote: (sol: Solution, opp: Opportunity) => void;
}) {
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);

  async function promote() {
    setPromoting(true);
    await onPromote(solution, opportunity);
    setPromoted(true);
    setPromoting(false);
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 14 }}>{solution.title}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
        {solution.rationale}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          padding: "8px 10px",
          background: "var(--surface-2)",
          borderRadius: "var(--radius)",
          borderLeft: "3px solid var(--accent)",
        }}
      >
        <span style={{ color: "var(--accent)", fontWeight: 600 }}>
          Experiment:{" "}
        </span>
        {solution.experiment}
      </div>
      {promoted ? (
        <div style={{ fontSize: 12, color: "var(--success)" }}>
          ✓ Initiative created.{" "}
          <a href="/initiatives" style={{ color: "var(--success)" }}>
            View →
          </a>
        </div>
      ) : (
        <button
          className="btn-ghost"
          style={{ fontSize: 12, padding: "5px 12px", alignSelf: "flex-start" }}
          onClick={promote}
          disabled={promoting}
        >
          {promoting ? "Creating…" : "→ Create Initiative"}
        </button>
      )}
    </div>
  );
}

function OpportunityNode({
  opp,
  index,
  onPromote,
}: {
  opp: Opportunity;
  index: number;
  onPromote: (sol: Solution, opp: Opportunity) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 0 }}>
      {/* Tree connector */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginRight: 16,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>
        <div
          style={{
            width: 2,
            flex: 1,
            background: "var(--border)",
            marginTop: 4,
          }}
        />
      </div>

      <div style={{ flex: 1, paddingBottom: 32 }}>
        {/* Opportunity header */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}>
            {opp.label}
          </div>
          {opp.insights.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {opp.insights.map((ins) => (
                <InsightPill key={ins.id} ins={ins} />
              ))}
            </div>
          )}
        </div>

        {/* Solutions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginLeft: 16 }}>
          {opp.solutions.map((sol) => (
            <SolutionCard
              key={sol.id}
              solution={sol}
              opportunity={opp}
              onPromote={onPromote}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OSTPage() {
  const [outcome, setOutcome] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    outcome: string;
    opportunities: Opportunity[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [insightCount, setInsightCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/okrs?productId=${PRODUCT_ID}`)
      .then((r) => r.json())
      .then(setOkrs)
      .catch(() => []);

    fetch(`/api/insights?productId=${PRODUCT_ID}`)
      .then((r) => r.json())
      .then((data: unknown[]) => setInsightCount(data.length))
      .catch(() => null);
  }, []);

  async function generate() {
    if (!outcome.trim()) return;
    setGenerating(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/ost/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, productId: PRODUCT_ID }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Unknown error");
    } else {
      setResult(data);
    }
    setGenerating(false);
  }

  async function handlePromote(sol: Solution, opp: Opportunity) {
    await fetch("/api/initiatives/from-solution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: PRODUCT_ID,
        solutionTitle: sol.title,
        opportunityLabel: opp.label,
        experiment: sol.experiment,
        insightIds: opp.insightIds,
      }),
    });
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <a href="/research" style={{ color: "var(--text-muted)", fontSize: 13 }}>
          ← Research
        </a>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
          Opportunity Solution Tree
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Pick a target outcome. Claude clusters your insights into opportunities
          and proposes solutions with experiments.
          {insightCount !== null && (
            <span>
              {" "}
              <strong style={{ color: "var(--text)" }}>
                {insightCount} insight{insightCount !== 1 ? "s" : ""}
              </strong>{" "}
              available.
            </span>
          )}
        </p>
      </div>

      <div className="card" style={{ marginTop: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          Target Outcome
        </h2>
        <input
          placeholder="e.g. Increase 7-day activation from 45% to 65%"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
          style={{ marginBottom: 10 }}
        />

        {okrs.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Or pick from an OKR objective
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {okrs.map((o) => (
                <button
                  key={o.id}
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: "4px 10px" }}
                  onClick={() => setOutcome(o.objective)}
                >
                  {o.quarter}: {o.objective}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={generate}
          disabled={generating || !outcome.trim()}
        >
          {generating ? "Building OST with Claude…" : "Generate Opportunity Solution Tree"}
        </button>

        {insightCount === 0 && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "var(--warning)",
            }}
          >
            ⚠️ No insights yet.{" "}
            <a href="/research">Extract some from interviews first</a>.
          </div>
        )}
      </div>

      {error && (
        <div
          className="card"
          style={{ borderColor: "var(--danger)", color: "var(--danger)", marginBottom: 24 }}
        >
          {error}
        </div>
      )}

      {result && (
        <div>
          {/* Outcome root node */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                padding: "10px 20px",
                background: "var(--accent)",
                borderRadius: "var(--radius)",
                fontWeight: 700,
                fontSize: 15,
                color: "#fff",
              }}
            >
              🎯 {result.outcome}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              {result.opportunities.length} opportunities ·{" "}
              {result.opportunities.reduce(
                (sum, o) => sum + o.solutions.length,
                0
              )}{" "}
              solutions
            </div>
          </div>

          {/* Tree */}
          <div style={{ marginLeft: 24 }}>
            {result.opportunities.map((opp, i) => (
              <OpportunityNode
                key={opp.id}
                opp={opp}
                index={i}
                onPromote={handlePromote}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
