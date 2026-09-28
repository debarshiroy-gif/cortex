"use client";

import { useState } from "react";
import type { ResearchExperiment } from "./types";
import { DiscussionThread } from "./DiscussionThread";
import { SecondaryResearchGate } from "./SecondaryResearchGate";
import { ModelChoiceSelect } from "@/components/ModelChoiceSelect";
import { useModelChoice } from "@/lib/useModelChoice";
import { parseKeyFindings, type FindingStance } from "@/lib/secondaryResearchReport";

interface SecondaryResearchPanelProps {
  experiment: ResearchExperiment;
  onUpdated: (experiment: ResearchExperiment) => void;
}

const STANCE_LABEL: Record<FindingStance, string> = {
  supports: "Supports",
  negates: "Negates",
  mixed: "Mixed",
};

const STANCE_COLOR: Record<FindingStance, string> = {
  supports: "var(--success)",
  negates: "var(--danger)",
  mixed: "var(--warning)",
};

export function SecondaryResearchPanel({ experiment, onUpdated }: SecondaryResearchPanelProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useModelChoice();

  async function run() {
    setRunning(true);
    setError(null);
    const res = await fetch(`/api/experiments/${experiment.id}/secondary-research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelChoice }),
    });
    setRunning(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to run research");
      return;
    }
    onUpdated((await res.json()) as ResearchExperiment);
  }

  const findings = experiment.result ? parseKeyFindings(experiment.result) : [];

  if (!experiment.result) {
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={running} />
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={run} disabled={running}>
            {running ? "Researching…" : "Run AI research"}
          </button>
        </div>
        {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{error}</p>}
        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
          Uses AI&apos;s own knowledge plus live web search. You can edit the result once it
          runs — that&apos;s how to override or veto its take.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Key Findings</div>
      <ul style={{ fontSize: 12, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {findings.map((f, i) => (
          <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span
              style={{
                flexShrink: 0,
                fontSize: 10,
                padding: "1px 6px",
                borderRadius: 99,
                background: "var(--surface-2)",
                color: STANCE_COLOR[f.stance],
                border: `1px solid ${STANCE_COLOR[f.stance]}`,
              }}
            >
              {STANCE_LABEL[f.stance]}
            </span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      {experiment.extendedReport && (
        <a
          href={`/api/experiments/${experiment.id}/secondary-research/export`}
          download
          style={{ display: "inline-block", fontSize: 11, marginTop: 8 }}
        >
          Download extended report and sources information
        </a>
      )}

      <SecondaryResearchGate experiment={experiment} onUpdated={onUpdated} />

      <DiscussionThread experiment={experiment} onUpdated={onUpdated} label="Discuss the findings" />
    </div>
  );
}
