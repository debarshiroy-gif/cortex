"use client";

import { useState } from "react";
import type { InitiativeResearchSummary, StrategyGateDecision } from "./types";

interface StrategyGateBannerProps {
  initiative: InitiativeResearchSummary;
  onUpdated: (patch: Partial<InitiativeResearchSummary>) => void;
}

const DECISION_LABEL: Record<Exclude<StrategyGateDecision, "pending">, string> = {
  proceed: "Proceed",
  pivot: "Pivot",
  kill: "Kill",
};

const DECISION_COLOR: Record<Exclude<StrategyGateDecision, "pending">, string> = {
  proceed: "var(--success)",
  pivot: "var(--warning)",
  kill: "var(--danger)",
};

export function StrategyGateBanner({ initiative, onUpdated }: StrategyGateBannerProps) {
  const [name, setName] = useState(initiative.strategyGateDecidedBy ?? "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState<StrategyGateDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Research question must be answered first — this gate comes after it.
  if (initiative.researchGateStatus === "undecided") {
    return null;
  }

  async function decide(strategyGateDecision: StrategyGateDecision) {
    setSaving(strategyGateDecision);
    setError(null);
    const res = await fetch(`/api/initiatives/${initiative.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        strategyGateDecision,
        strategyGateNote: strategyGateDecision === "pending" ? undefined : note,
        strategyGateDecidedBy: strategyGateDecision === "pending" ? undefined : name,
      }),
    });
    setSaving(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
      return;
    }
    const updated = await res.json();
    onUpdated({
      status: updated.status,
      strategyGateDecision: updated.strategyGateDecision,
      strategyGateNote: updated.strategyGateNote,
      strategyGateDecidedBy: updated.strategyGateDecidedBy,
      strategyGateDecidedAt: updated.strategyGateDecidedAt,
    });
    setNote("");
  }

  if (initiative.strategyGateDecision !== "pending") {
    const decision = initiative.strategyGateDecision;
    return (
      <div
        className="card"
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 99,
                background: "var(--surface-2)",
                color: DECISION_COLOR[decision],
                border: `1px solid ${DECISION_COLOR[decision]}`,
              }}
            >
              Strategy gate: {DECISION_LABEL[decision]}
            </span>
            {initiative.strategyGateDecidedAt && (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                by {initiative.strategyGateDecidedBy} ·{" "}
                {new Date(initiative.strategyGateDecidedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {initiative.strategyGateNote && (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{initiative.strategyGateNote}</p>
          )}
        </div>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => decide("pending")}>
          Reconsider
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 24, borderColor: "var(--accent)" }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Strategy gate
      </div>
      <p style={{ fontSize: 15, marginBottom: 16 }}>Does this initiative make sense to pursue?</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea
          rows={2}
          placeholder="Rationale for your decision"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn-primary"
          onClick={() => decide("proceed")}
          disabled={saving !== null || !name.trim() || !note.trim()}
        >
          {saving === "proceed" ? "Saving…" : "Proceed"}
        </button>
        <button
          className="btn-ghost"
          onClick={() => decide("pivot")}
          disabled={saving !== null || !name.trim() || !note.trim()}
        >
          {saving === "pivot" ? "Saving…" : "Pivot"}
        </button>
        <button
          className="btn-ghost"
          style={{ color: "var(--danger)" }}
          onClick={() => decide("kill")}
          disabled={saving !== null || !name.trim() || !note.trim()}
        >
          {saving === "kill" ? "Saving…" : "Kill"}
        </button>
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
