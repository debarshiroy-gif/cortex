"use client";

import { useState } from "react";
import type { ResearchExperiment } from "./types";
import { DiscussionThread } from "./DiscussionThread";

interface SecondaryResearchPanelProps {
  experiment: ResearchExperiment;
  onUpdated: (experiment: ResearchExperiment) => void;
}

interface Source {
  url: string;
  title: string;
}

function parseSources(json: string): Source[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function SecondaryResearchPanel({ experiment, onUpdated }: SecondaryResearchPanelProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    const res = await fetch(`/api/experiments/${experiment.id}/secondary-research`, {
      method: "POST",
    });
    setRunning(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to run research");
      return;
    }
    onUpdated((await res.json()) as ResearchExperiment);
  }

  const sources = parseSources(experiment.sources);

  if (!experiment.result) {
    return (
      <div style={{ marginTop: 8 }}>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={run} disabled={running}>
          {running ? "Researching…" : "Run AI research"}
        </button>
        {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{error}</p>}
        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
          Uses Claude&apos;s own knowledge plus live web search. You can edit the result once it
          runs — that&apos;s how to override or veto its take.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      {sources.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Sources</div>
          <ul style={{ fontSize: 11, paddingLeft: 16 }}>
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      <DiscussionThread experiment={experiment} onUpdated={onUpdated} label="Discuss the findings" />
    </div>
  );
}
