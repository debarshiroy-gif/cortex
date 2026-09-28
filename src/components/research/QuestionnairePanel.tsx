"use client";

import { useState } from "react";
import type { ResearchExperiment } from "./types";
import { DiscussionThread } from "./DiscussionThread";
import { ModelChoiceSelect } from "@/components/ModelChoiceSelect";
import { useModelChoice } from "@/lib/useModelChoice";

interface QuestionnairePanelProps {
  experiment: ResearchExperiment;
  onUpdated: (experiment: ResearchExperiment) => void;
}

export function QuestionnairePanel({ experiment, onUpdated }: QuestionnairePanelProps) {
  const [drafting, setDrafting] = useState(false);
  const [marking, setMarking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(experiment.outreachDraft ?? "");
  const [saving, setSaving] = useState(false);
  const [responses, setResponses] = useState(experiment.surveyResponses ?? "");
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useModelChoice();

  async function draft() {
    setDrafting(true);
    setError(null);
    const res = await fetch(`/api/experiments/${experiment.id}/draft-outreach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelChoice }),
    });
    setDrafting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to draft questionnaire");
      return;
    }
    onUpdated((await res.json()) as ResearchExperiment);
  }

  async function saveDraft() {
    setSaving(true);
    const res = await fetch(`/api/experiments/${experiment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outreachDraft: draftText }),
    });
    setSaving(false);
    if (res.ok) {
      onUpdated((await res.json()) as ResearchExperiment);
      setEditing(false);
    }
  }

  async function markSent() {
    setMarking(true);
    const res = await fetch(`/api/experiments/${experiment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentAt: new Date().toISOString() }),
    });
    setMarking(false);
    if (res.ok) onUpdated((await res.json()) as ResearchExperiment);
  }

  async function synthesize() {
    if (!responses.trim()) return;
    setSynthesizing(true);
    setError(null);
    const res = await fetch(`/api/experiments/${experiment.id}/synthesize-survey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses, model: modelChoice }),
    });
    setSynthesizing(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to synthesize responses");
      return;
    }
    onUpdated((await res.json()) as ResearchExperiment);
  }

  if (!experiment.outreachDraft) {
    return (
      <div style={{ marginTop: 8 }}>
        <DiscussionThread
          experiment={experiment}
          onUpdated={onUpdated}
          label="Discuss success metric with AI"
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={drafting} />
          <button
            className="btn-ghost"
            style={{ fontSize: 12 }}
            onClick={draft}
            disabled={drafting}
          >
            {drafting ? "Drafting…" : "Draft questionnaire with AI"}
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
      {experiment.targetAudience && (
        <p style={{ fontSize: 12, marginBottom: 6 }}>
          <strong>Audience:</strong> {experiment.targetAudience}
        </p>
      )}

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <textarea
            rows={6}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            style={{ fontSize: 12 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" style={{ fontSize: 12 }} onClick={saveDraft} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{experiment.outreachDraft}</p>
          <button
            className="btn-ghost"
            style={{ fontSize: 11, marginTop: 6 }}
            onClick={() => {
              setDraftText(experiment.outreachDraft ?? "");
              setEditing(true);
            }}
          >
            Edit questions
          </button>
        </>
      )}

      {experiment.sentAt ? (
        <p style={{ fontSize: 11, color: "var(--success)", marginTop: 8 }}>
          Sent on {new Date(experiment.sentAt).toLocaleDateString()}
        </p>
      ) : (
        !editing && (
          <button
            className="btn-ghost"
            style={{ fontSize: 12, marginTop: 8 }}
            onClick={markSent}
            disabled={marking}
          >
            {marking ? "Saving…" : "Mark as sent"}
          </button>
        )
      )}

      {experiment.sentAt && !experiment.result && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 12, fontWeight: 600 }}>Paste in the responses you received</p>
          <textarea
            rows={5}
            placeholder="Paste raw responses here — one per line, or however you have them…"
            value={responses}
            onChange={(e) => setResponses(e.target.value)}
            style={{ fontSize: 12 }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={synthesizing} />
            <button
              className="btn-primary"
              style={{ fontSize: 12 }}
              onClick={synthesize}
              disabled={synthesizing || !responses.trim()}
            >
              {synthesizing ? "Synthesizing…" : "Synthesize with AI"}
            </button>
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
