"use client";

import { useState } from "react";
import type { ResearchExperiment } from "./types";
import { useModelChoice } from "@/lib/useModelChoice";

interface SecondaryResearchGateProps {
  experiment: ResearchExperiment;
  onUpdated: (experiment: ResearchExperiment) => void;
}

export function SecondaryResearchGate({ experiment, onUpdated }: SecondaryResearchGateProps) {
  const [name, setName] = useState(experiment.researchAcceptedBy ?? "");
  const [correction, setCorrection] = useState("");
  const [saving, setSaving] = useState<"accept" | "reconsider" | "redo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelChoice] = useModelChoice();

  async function setAccepted(accepted: boolean) {
    setSaving(accepted ? "accept" : "reconsider");
    setError(null);
    const res = await fetch(`/api/experiments/${experiment.id}/secondary-research/accept`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted, acceptedBy: name }),
    });
    setSaving(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
      return;
    }
    onUpdated((await res.json()) as ResearchExperiment);
  }

  async function redo() {
    setSaving("redo");
    setError(null);
    const res = await fetch(`/api/experiments/${experiment.id}/secondary-research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correction, model: modelChoice }),
    });
    setSaving(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to redo research");
      return;
    }
    onUpdated((await res.json()) as ResearchExperiment);
    setCorrection("");
  }

  if (experiment.researchAccepted) {
    return (
      <div
        className="card"
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 99,
              background: "var(--surface-2)",
              color: "var(--success)",
              border: "1px solid var(--success)",
            }}
          >
            Findings accepted
          </span>
          {experiment.researchAcceptedAt && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              by {experiment.researchAcceptedBy} ·{" "}
              {new Date(experiment.researchAcceptedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <button
          className="btn-ghost"
          style={{ fontSize: 12 }}
          onClick={() => setAccepted(false)}
          disabled={saving !== null}
        >
          {saving === "reconsider" ? "Saving…" : "Reconsider"}
        </button>
        {error && <p style={{ color: "var(--danger)", fontSize: 12, width: "100%" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 12, borderColor: "var(--accent)" }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Is this research good to build on?
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <button
          className="btn-primary"
          style={{ alignSelf: "flex-start" }}
          onClick={() => setAccepted(true)}
          disabled={saving !== null || !name.trim()}
        >
          {saving === "accept" ? "Saving…" : "Accept findings"}
        </button>
      </div>

      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
        }}
      >
        Or, if the hypothesis or considerations behind this research were wrong:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <textarea
          rows={2}
          placeholder="What's wrong, or what should we reconsider?"
          value={correction}
          onChange={(e) => setCorrection(e.target.value)}
        />
        <button
          className="btn-ghost"
          style={{ alignSelf: "flex-start", fontSize: 12 }}
          onClick={redo}
          disabled={saving !== null || !correction.trim()}
        >
          {saving === "redo" ? "Redoing…" : "Redo research"}
        </button>
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
