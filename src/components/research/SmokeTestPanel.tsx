"use client";

import { useState } from "react";
import type { ResearchExperiment } from "./types";
import { ModelChoiceSelect } from "@/components/ModelChoiceSelect";
import { useModelChoice } from "@/lib/useModelChoice";

interface SmokeTestPanelProps {
  experiment: ResearchExperiment;
  onUpdated: (experiment: ResearchExperiment) => void;
}

export function SmokeTestPanel({ experiment, onUpdated }: SmokeTestPanelProps) {
  const [drafting, setDrafting] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useModelChoice();

  async function draft() {
    setDrafting(true);
    setError(null);
    try {
      const res = await fetch(`/api/experiments/${experiment.id}/draft-outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelChoice }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to draft landing copy");
        return;
      }
      onUpdated((await res.json()) as ResearchExperiment);
    } catch {
      setError("Could not reach Cortex. Check the server and try again.");
    } finally {
      setDrafting(false);
    }
  }

  async function markPublished() {
    setMarking(true);
    const res = await fetch(`/api/experiments/${experiment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentAt: new Date().toISOString() }),
    });
    setMarking(false);
    if (res.ok) onUpdated((await res.json()) as ResearchExperiment);
  }

  if (!experiment.outreachDraft) {
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={drafting} />
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={draft} disabled={drafting}>
            {drafting ? "Drafting…" : "Draft landing copy with AI"}
          </button>
        </div>
        {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      <p style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{experiment.outreachDraft}</p>

      {experiment.sentAt ? (
        <p style={{ fontSize: 11, color: "var(--success)", marginTop: 8 }}>
          Published on {new Date(experiment.sentAt).toLocaleDateString()} — record the real signal
          (signups, clicks) as this experiment&apos;s result once you have it.
        </p>
      ) : (
        <button
          className="btn-ghost"
          style={{ fontSize: 12, marginTop: 8 }}
          onClick={markPublished}
          disabled={marking}
        >
          {marking ? "Saving…" : "Mark as published"}
        </button>
      )}
    </div>
  );
}
