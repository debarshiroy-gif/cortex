"use client";

import { useEffect, useState } from "react";
import type { ResearchExperiment } from "./types";
import type { PrototypeVersion } from "@/components/prototype/types";
import { readabilityBand } from "@/lib/readability";

interface ABTestPanelProps {
  experiment: ResearchExperiment;
  onUpdated: (experiment: ResearchExperiment) => void;
}

interface ABResult {
  versionId: string;
  versionNumber: number;
  readabilityScore: number | null;
  responseCount: number;
  averageRating: number | null;
  completionRate: number | null;
  averageTimeToCompleteMs: number | null;
  comments: string[];
}

function SetupForm({ experiment, onUpdated }: ABTestPanelProps) {
  const [versions, setVersions] = useState<PrototypeVersion[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!experiment.initiativeId) return;
    fetch(`/api/prototype-versions?initiativeId=${experiment.initiativeId}`)
      .then((r) => r.json())
      .then(setVersions);
  }, [experiment.initiativeId]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function setup() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/experiments/${experiment.id}/setup-ab-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionIds: selected,
        customQuestions: questions.map((q) => q.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to set up test");
      return;
    }
    onUpdated((await res.json()) as ResearchExperiment);
  }

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Choose at least 2 prototype versions to compare:
      </p>
      {versions.map((v) => (
        <label key={v.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={selected.includes(v.id)}
            onChange={() => toggle(v.id)}
          />
          v{v.versionNumber} ({v.kind})
          {v.readabilityScore != null && ` — readability ${readabilityBand(v.readabilityScore)}`}
        </label>
      ))}

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
        Custom questions (optional, in addition to the default rating + comment):
      </p>
      {questions.map((q, i) => (
        <input
          key={i}
          value={q}
          placeholder={`Custom question ${i + 1}`}
          onChange={(e) =>
            setQuestions((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))
          }
        />
      ))}
      <button
        className="btn-ghost"
        style={{ fontSize: 11, alignSelf: "flex-start" }}
        onClick={() => setQuestions((prev) => [...prev, ""])}
      >
        + Add custom question
      </button>

      {error && <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p>}
      <button
        className="btn-primary"
        style={{ fontSize: 12, alignSelf: "flex-start" }}
        onClick={setup}
        disabled={saving || selected.length < 2}
      >
        {saving ? "Setting up…" : "Set up test"}
      </button>
    </div>
  );
}

function ResultsView({ experiment, onUpdated }: ABTestPanelProps) {
  const [results, setResults] = useState<ABResult[] | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/test/${experiment.shareToken}` : "";

  useEffect(() => {
    fetch(`/api/experiments/${experiment.id}/ab-results`)
      .then((r) => r.json())
      .then((data) => setResults(data.results));
  }, [experiment.id]);

  async function synthesize() {
    setSynthesizing(true);
    const res = await fetch(`/api/experiments/${experiment.id}/ab-synthesize`, { method: "POST" });
    setSynthesizing(false);
    if (res.ok) onUpdated((await res.json()) as ResearchExperiment);
  }

  const totalResponses = results?.reduce((sum, r) => sum + r.responseCount, 0) ?? 0;

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input readOnly value={shareUrl} style={{ fontSize: 11, flex: 1 }} />
        <button
          className="btn-ghost"
          style={{ fontSize: 11 }}
          onClick={() => {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      {results && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
            The link above randomly assigns a variant per visit — use these per-version links to
            preview each one directly, or to deliberately send a specific variant to a group.
          </p>
          {results.map((r) => (
            <div
              key={r.versionId}
              style={{
                fontSize: 12,
                padding: 8,
                background: "var(--surface)",
                borderRadius: "var(--radius)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div>
                <strong>v{r.versionNumber}</strong> — {r.responseCount} response
                {r.responseCount === 1 ? "" : "s"}
                {r.averageRating != null && `, avg rating ${r.averageRating.toFixed(1)}`}
                {r.completionRate != null && `, ${Math.round(r.completionRate * 100)}% completed`}
                {r.averageTimeToCompleteMs != null &&
                  `, avg time ${Math.round(r.averageTimeToCompleteMs / 1000)}s`}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input readOnly value={`${shareUrl}?variant=${r.versionId}`} style={{ fontSize: 11, flex: 1 }} />
                <button
                  className="btn-ghost"
                  style={{ fontSize: 11 }}
                  onClick={() => navigator.clipboard.writeText(`${shareUrl}?variant=${r.versionId}`)}
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalResponses > 0 && !experiment.result && (
        <button
          className="btn-ghost"
          style={{ fontSize: 12, alignSelf: "flex-start" }}
          onClick={synthesize}
          disabled={synthesizing}
        >
          {synthesizing ? "Synthesizing…" : "Synthesize with AI"}
        </button>
      )}
    </div>
  );
}

export function ABTestPanel({ experiment, onUpdated }: ABTestPanelProps) {
  if (!experiment.shareToken) {
    return <SetupForm experiment={experiment} onUpdated={onUpdated} />;
  }
  return <ResultsView experiment={experiment} onUpdated={onUpdated} />;
}
