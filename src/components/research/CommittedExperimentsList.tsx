"use client";

import { useState } from "react";
import { METHOD_LABEL, getExperimentStage } from "./methodLabels";
import { QuestionnairePanel } from "./QuestionnairePanel";
import { DataAnalysisPanel } from "./DataAnalysisPanel";
import { SecondaryResearchPanel } from "./SecondaryResearchPanel";
import { SmokeTestPanel } from "./SmokeTestPanel";
import { ABTestPanel } from "./ABTestPanel";
import type { ExperimentStatus, ResearchExperiment } from "./types";

const NEXT_STATUS: Record<ExperimentStatus, ExperimentStatus | null> = {
  planned: "running",
  running: "completed",
  completed: null,
};

interface CommittedExperimentsListProps {
  experiments: ResearchExperiment[];
  onUpdated: (experiment: ResearchExperiment) => void;
}

function ExperimentRow({
  experiment,
  onUpdated,
}: {
  experiment: ResearchExperiment;
  onUpdated: (experiment: ResearchExperiment) => void;
}) {
  const [editingResult, setEditingResult] = useState(false);
  const [result, setResult] = useState(experiment.result ?? "");
  const [watchOut, setWatchOut] = useState(experiment.watchOut ?? "");
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/experiments/${experiment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) onUpdated((await res.json()) as ResearchExperiment);
  }

  const next = NEXT_STATUS[experiment.status];

  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--surface-2)",
        borderRadius: "var(--radius)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <span className={`badge badge-${experiment.status}`}>{experiment.status}</span>
            {getExperimentStage(experiment.method) !== "other" && (
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: "var(--surface)",
                  color:
                    getExperimentStage(experiment.method) === "validation"
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  border: `1px solid ${
                    getExperimentStage(experiment.method) === "validation"
                      ? "var(--accent)"
                      : "var(--border)"
                  }`,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {getExperimentStage(experiment.method) === "validation" ? "Validation" : "Strategy"}
              </span>
            )}
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {METHOD_LABEL[experiment.method] ?? experiment.method}
            </span>
          </div>
          {experiment.hypothesis && (
            <p style={{ fontSize: 12, marginBottom: 2 }}>{experiment.hypothesis}</p>
          )}
          {experiment.successMetric && (
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Success metric: {experiment.successMetric}
            </p>
          )}
        </div>
        {next && (
          <button
            className="btn-ghost"
            style={{ fontSize: 11, padding: "4px 10px", flexShrink: 0 }}
            onClick={() => (next === "completed" ? setEditingResult(true) : patch({ status: next }))}
            disabled={saving}
          >
            Mark {next}
          </button>
        )}
      </div>

      {experiment.method === "survey" && (
        <QuestionnairePanel experiment={experiment} onUpdated={onUpdated} />
      )}
      {experiment.method === "fake_door_test" && (
        <SmokeTestPanel experiment={experiment} onUpdated={onUpdated} />
      )}
      {experiment.method === "data_analysis" && (
        <DataAnalysisPanel experiment={experiment} onUpdated={onUpdated} />
      )}
      {experiment.method === "secondary_research" && (
        <SecondaryResearchPanel experiment={experiment} onUpdated={onUpdated} />
      )}
      {experiment.method === "ab_test" && (
        <ABTestPanel experiment={experiment} onUpdated={onUpdated} />
      )}

      {experiment.result && !editingResult && (
        <p style={{ fontSize: 12, marginTop: 8, color: "var(--success)" }}>
          Result: {experiment.result}
        </p>
      )}
      {experiment.watchOut && !editingResult && (
        <p style={{ fontSize: 11, marginTop: 4, color: "var(--warning)" }}>
          Watch out: {experiment.watchOut}
        </p>
      )}

      {editingResult && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <input
            placeholder="Result — what did you learn?"
            value={result}
            onChange={(e) => setResult(e.target.value)}
          />
          <input
            placeholder="Watch out (caveats, optional)"
            value={watchOut}
            onChange={(e) => setWatchOut(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-primary"
              style={{ fontSize: 12 }}
              onClick={() => {
                patch({ status: "completed", result, watchOut: watchOut || undefined });
                setEditingResult(false);
              }}
              disabled={saving || !result.trim()}
            >
              Save & mark completed
            </button>
            <button
              className="btn-ghost"
              style={{ fontSize: 12 }}
              onClick={() => setEditingResult(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommittedExperimentsList({
  experiments,
  onUpdated,
}: CommittedExperimentsListProps) {
  if (experiments.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
        No experiments committed yet.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {experiments.map((e) => (
        <ExperimentRow key={e.id} experiment={e} onUpdated={onUpdated} />
      ))}
    </div>
  );
}
