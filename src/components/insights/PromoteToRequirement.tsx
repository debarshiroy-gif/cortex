"use client";

import { useState } from "react";
import type { Experiment, FeatureOption } from "./types";

interface PromoteToRequirementProps {
  insightId: string;
  productId: string;
  experiments: Experiment[];
}

export function PromoteToRequirement({
  insightId,
  productId,
  experiments,
}: PromoteToRequirementProps) {
  const [open, setOpen] = useState(false);
  const [features, setFeatures] = useState<FeatureOption[] | null>(null);
  const [featureId, setFeatureId] = useState("");
  const [regime, setRegime] = useState<"regulated" | "non_regulated">(
    "non_regulated"
  );
  const [experimentId, setExperimentId] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [outcome, setOutcome] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  async function open_() {
    setOpen(true);
    if (features) return;
    const res = await fetch(`/api/features?productId=${productId}`);
    const data = (await res.json()) as FeatureOption[];
    setFeatures(data);
    if (data.length > 0) setFeatureId(data[0].id);
  }

  async function promote() {
    if (!featureId) return;
    setPromoting(true);
    setOutcome(null);
    const res = await fetch(`/api/insights/${insightId}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        featureId,
        regime,
        experimentId: experimentId || undefined,
      }),
    });
    setPromoting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setOutcome({ ok: false, message: data.error ?? "Promotion failed" });
      return;
    }
    const requirement = await res.json();
    setOutcome({
      ok: true,
      message: `Created a ${regime} requirement (${requirement.gateStatus} gate)${
        requirement.sourceProvenance
          ? ` — provenance: ${requirement.sourceProvenance}`
          : " — no linked experiment, so no provenance yet"
      }. View it on the feature's PRD page.`,
    });
  }

  if (!open) {
    return (
      <button className="btn-ghost" style={{ fontSize: 12, marginTop: 8 }} onClick={open_}>
        Promote to Requirement →
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        background: "var(--surface-2)",
        borderRadius: "var(--radius)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {features === null ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading features…</p>
      ) : features.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          No features exist yet — create one on an initiative first.
        </p>
      ) : (
        <>
          <select value={featureId} onChange={(e) => setFeatureId(e.target.value)}>
            {features.map((f) => (
              <option key={f.id} value={f.id}>
                {f.initiative.name} / {f.name}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="radio"
                style={{ width: "auto" }}
                checked={regime === "non_regulated"}
                onChange={() => setRegime("non_regulated")}
              />
              Non-regulated (automatic)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="radio"
                style={{ width: "auto" }}
                checked={regime === "regulated"}
                onChange={() => setRegime("regulated")}
              />
              Regulated (flag for expert review)
            </label>
          </div>

          {experiments.length > 0 && (
            <select value={experimentId} onChange={(e) => setExperimentId(e.target.value)}>
              <option value="">Use most recent experiment as provenance</option>
              {experiments.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.method}
                  {exp.sampleSize != null ? ` (n=${exp.sampleSize})` : ""}
                </option>
              ))}
            </select>
          )}

          {outcome && (
            <p style={{ fontSize: 12, color: outcome.ok ? "var(--success)" : "var(--danger)" }}>
              {outcome.message}
            </p>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-primary"
              style={{ fontSize: 12 }}
              onClick={promote}
              disabled={promoting || !featureId}
            >
              {promoting ? "Promoting…" : "Promote"}
            </button>
            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
