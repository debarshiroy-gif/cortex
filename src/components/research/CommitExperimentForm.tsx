"use client";

import { useState } from "react";
import { AB_TEST_MIN_VERSIONS, METHOD_LABEL, STRATEGY_GATE_METHODS, VALIDATION_METHODS } from "./methodLabels";
import type { ResearchExperiment } from "./types";

interface CommitExperimentFormProps {
  initiativeId: string;
  hasPrototype: boolean;
  prototypeVersionCount: number;
  initialMethod?: string;
  initialHypothesis?: string;
  initialSuccessMetric?: string;
  onCommitted: (experiment: ResearchExperiment) => void;
  onCancel: () => void;
}

export function CommitExperimentForm({
  initiativeId,
  hasPrototype,
  prototypeVersionCount,
  initialMethod,
  initialHypothesis,
  initialSuccessMetric,
  onCommitted,
  onCancel,
}: CommitExperimentFormProps) {
  const [method, setMethod] = useState(initialMethod ?? STRATEGY_GATE_METHODS[0]);
  const [hypothesis, setHypothesis] = useState(initialHypothesis ?? "");
  const [successMetric, setSuccessMetric] = useState(initialSuccessMetric ?? "");
  const [sampleSize, setSampleSize] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function commit() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initiativeId,
        method,
        hypothesis: hypothesis || undefined,
        successMetric: successMetric || undefined,
        sampleSize: sampleSize || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to commit experiment");
      return;
    }
    onCommitted((await res.json()) as ResearchExperiment);
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: 12,
        background: "var(--surface-2)",
        borderRadius: "var(--radius)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <select value={method} onChange={(e) => setMethod(e.target.value)}>
        <optgroup label="Strategy gate">
          {STRATEGY_GATE_METHODS.map((m) => (
            <option key={m} value={m}>
              {METHOD_LABEL[m]}
            </option>
          ))}
        </optgroup>
        <optgroup label="Validation">
          {VALIDATION_METHODS.map((m) => {
            const disabled =
              m === "ab_test" ? prototypeVersionCount < AB_TEST_MIN_VERSIONS : !hasPrototype;
            const note =
              m === "ab_test" && prototypeVersionCount < AB_TEST_MIN_VERSIONS
                ? ` — needs ${AB_TEST_MIN_VERSIONS} prototype versions`
                : !hasPrototype
                  ? " — after prototyping"
                  : "";
            return (
              <option key={m} value={m} disabled={disabled}>
                {METHOD_LABEL[m]}
                {note}
              </option>
            );
          })}
        </optgroup>
      </select>
      {!hasPrototype && (
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Validation methods unlock once a prototype exists for this initiative.
        </p>
      )}
      <input
        placeholder="Hypothesis"
        value={hypothesis}
        onChange={(e) => setHypothesis(e.target.value)}
      />
      <input
        placeholder="Success metric"
        value={successMetric}
        onChange={(e) => setSuccessMetric(e.target.value)}
      />
      <input
        type="number"
        placeholder="Sample size (optional)"
        value={sampleSize}
        onChange={(e) => setSampleSize(e.target.value)}
        style={{ maxWidth: 160 }}
      />
      {error && <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-primary" style={{ fontSize: 12 }} onClick={commit} disabled={saving}>
          {saving ? "Committing…" : "Commit this experiment"}
        </button>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}
