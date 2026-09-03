"use client";

import { useState } from "react";
import { EXPERIMENT_METHODS, type Experiment } from "./types";

interface ExperimentManagerProps {
  insightId: string;
  experiments: Experiment[];
  onCreated: (experiment: Experiment) => void;
}

const METHOD_LABEL: Record<string, string> = {
  survey: "Survey",
  jtbd_interview: "JTBD interview",
  ai_moderated_interview: "AI-moderated interview",
  usability_test: "Usability test",
  live_experiment: "Live experiment",
  usage_analytics: "Usage analytics",
  session_replay: "Session replay",
  support_data: "Support data",
  qual_corpus: "Qualitative corpus",
  market_research: "Market research",
};

export function ExperimentManager({
  insightId,
  experiments,
  onCreated,
}: ExperimentManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [method, setMethod] = useState<string>(EXPERIMENT_METHODS[0]);
  const [hypothesis, setHypothesis] = useState("");
  const [successMetric, setSuccessMetric] = useState("");
  const [sampleSize, setSampleSize] = useState("");
  const [effectSize, setEffectSize] = useState("");
  const [result, setResult] = useState("");
  const [watchOut, setWatchOut] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        insightId,
        method,
        hypothesis: hypothesis || undefined,
        successMetric: successMetric || undefined,
        sampleSize: sampleSize || undefined,
        effectSize: effectSize || undefined,
        result: result || undefined,
        watchOut: watchOut || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save experiment");
      return;
    }
    onCreated((await res.json()) as Experiment);
    setShowForm(false);
    setHypothesis("");
    setSuccessMetric("");
    setSampleSize("");
    setEffectSize("");
    setResult("");
    setWatchOut("");
  }

  return (
    <div>
      {experiments.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          No experiments recorded yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {experiments.map((exp) => (
            <div
              key={exp.id}
              style={{
                fontSize: 12,
                padding: "8px 10px",
                background: "var(--surface-2)",
                borderRadius: "var(--radius)",
              }}
            >
              <div style={{ fontWeight: 600 }}>
                {METHOD_LABEL[exp.method] ?? exp.method}
                {exp.sampleSize != null ? ` · n=${exp.sampleSize}` : ""}
                {exp.effectSize != null ? ` · effect size ${exp.effectSize}` : ""}
              </div>
              {exp.result && <div style={{ marginTop: 2 }}>{exp.result}</div>}
              {exp.watchOut && (
                <div style={{ marginTop: 2, color: "var(--warning)" }}>
                  Watch out: {exp.watchOut}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {EXPERIMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABEL[m]}
              </option>
            ))}
          </select>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input
              type="number"
              placeholder="Sample size (n)"
              value={sampleSize}
              onChange={(e) => setSampleSize(e.target.value)}
            />
            <input
              type="number"
              step="any"
              placeholder="Effect size"
              value={effectSize}
              onChange={(e) => setEffectSize(e.target.value)}
            />
          </div>
          <input
            placeholder="Result"
            value={result}
            onChange={(e) => setResult(e.target.value)}
          />
          <input
            placeholder="Watch out (caveats)"
            value={watchOut}
            onChange={(e) => setWatchOut(e.target.value)}
          />
          {error && <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" style={{ fontSize: 12 }} onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save experiment"}
            </button>
            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn-ghost"
          style={{ fontSize: 12, marginTop: 8 }}
          onClick={() => setShowForm(true)}
        >
          + Add experiment
        </button>
      )}
    </div>
  );
}
