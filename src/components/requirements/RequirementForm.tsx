"use client";

import { useState } from "react";
import type { Regime } from "./RegimeWizard";
import type { Requirement } from "./types";

interface RequirementFormProps {
  featureId: string;
  regime: Regime;
  onCreated: (requirement: Requirement) => void;
  onCancel: () => void;
}

function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function RequirementForm({
  featureId,
  regime,
  onCreated,
  onCancel,
}: RequirementFormProps) {
  const [requirementText, setRequirementText] = useState("");
  const [sourceProvenance, setSourceProvenance] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [edgeCases, setEdgeCases] = useState("");
  const [riskIfWrong, setRiskIfWrong] = useState("");
  const [draftedBy, setDraftedBy] = useState<"ai" | "human">("human");
  const [linkedInsightId, setLinkedInsightId] = useState("");
  const [linkedPrototypeArea, setLinkedPrototypeArea] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!requirementText.trim()) {
      setError("requirement_text is required");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        featureId,
        regime,
        requirementText,
        sourceProvenance: sourceProvenance || undefined,
        ownerName: ownerName || undefined,
        acceptanceCriteria: linesToArray(acceptanceCriteria),
        edgeCases: linesToArray(edgeCases),
        riskIfWrong: riskIfWrong || undefined,
        draftedBy,
        linkedInsightId: linkedInsightId || undefined,
        linkedPrototypeArea: linkedPrototypeArea || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create requirement");
      return;
    }
    const requirement = (await res.json()) as Requirement;
    onCreated(requirement);
  }

  return (
    <div className="card" style={{ borderColor: "var(--accent)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>New Requirement</h3>
        <span className={`badge badge-${regime}`}>
          {regime === "regulated" ? "Regulated" : "Non-regulated"}
        </span>
      </div>

      {regime === "regulated" && (
        <p style={{ fontSize: 12, color: "var(--warning)", marginBottom: 12 }}>
          Regulated requirements need source_provenance filled in before they can
          leave the draft gate.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            Requirement text
          </label>
          <textarea
            rows={2}
            value={requirementText}
            onChange={(e) => setRequirementText(e.target.value)}
            placeholder="The system shall…"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            Source / provenance {regime === "regulated" && "(required to leave draft)"}
          </label>
          <input
            value={sourceProvenance}
            onChange={(e) => setSourceProvenance(e.target.value)}
            placeholder="Regulation, policy, or precedent citation"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Owner
            </label>
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Drafted by
            </label>
            <select
              value={draftedBy}
              onChange={(e) => setDraftedBy(e.target.value as "ai" | "human")}
            >
              <option value="human">Human</option>
              <option value="ai">AI</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            Acceptance criteria (one per line)
          </label>
          <textarea
            rows={3}
            value={acceptanceCriteria}
            onChange={(e) => setAcceptanceCriteria(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            Edge cases (one per line)
          </label>
          <textarea
            rows={3}
            value={edgeCases}
            onChange={(e) => setEdgeCases(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            Risk if wrong
          </label>
          <input value={riskIfWrong} onChange={(e) => setRiskIfWrong(e.target.value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Linked insight ID (optional)
            </label>
            <input
              value={linkedInsightId}
              onChange={(e) => setLinkedInsightId(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Linked prototype area (optional)
            </label>
            <input
              value={linkedPrototypeArea}
              onChange={(e) => setLinkedPrototypeArea(e.target.value)}
            />
          </div>
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Create Requirement"}
          </button>
          <button className="btn-ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
