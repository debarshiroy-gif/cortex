"use client";

import { useEffect, useState } from "react";
import type { MeetingNote } from "./types";
import { ModelChoiceSelect } from "@/components/ModelChoiceSelect";
import { useModelChoice } from "@/lib/useModelChoice";

interface Persona {
  id: string;
  name: string;
}

type JobStatement = {
  type: "functional" | "emotional" | "social";
  situation: string;
  motivation: string;
  outcome: string;
  statement: string;
  confidence: "high" | "med" | "low";
};

interface MeetingNoteExtractProps {
  note: MeetingNote;
  productId: string;
  onLinked: (insightId: string) => void;
}

export function MeetingNoteExtract({
  note,
  productId,
  onLinked,
}: MeetingNoteExtractProps) {
  const [open, setOpen] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaId, setPersonaId] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<JobStatement[]>([]);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useModelChoice();

  useEffect(() => {
    if (!open || personas.length > 0) return;
    fetch(`/api/personas?productId=${productId}`)
      .then((r) => r.json())
      .then((data: Persona[]) => {
        setPersonas(data);
        if (data.length > 0) setPersonaId(data[0].id);
      });
  }, [open, productId, personas.length]);

  async function extract() {
    if (!personaId) {
      setError("Pick a persona this note applies to first");
      return;
    }
    setError(null);
    setExtracting(true);

    try {
      const interviewRes = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId, notes: note.rawContent }),
      });
      const interview = await interviewRes.json();
      if (!interviewRes.ok) {
        setError(interview.error ?? "Failed to create interview from this note");
        return;
      }
      setInterviewId(interview.id);

      const extractResRaw = await fetch(`/api/interviews/${interview.id}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelChoice }),
      });
      const extractRes = await extractResRaw.json();
      if (!extractResRaw.ok) {
        setError(extractRes.error ?? "Failed to extract insights");
        return;
      }
      setExtracted(extractRes.jobStatements ?? []);
    } catch {
      setError("Failed to reach the server. Please retry.");
    } finally {
      setExtracting(false);
    }
  }

  async function saveInsights() {
    if (!interviewId || extracted.length === 0) return;
    setSaving(true);

    const payload = extracted.map((js) => ({
      interviewId,
      summary: js.statement,
      tags: ["jtbd", js.type],
      confidence: js.confidence,
    }));

    const created = await fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json());

    if (created[0]?.id) {
      await fetch(`/api/meeting-notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedInsightId: created[0].id }),
      });
      onLinked(created[0].id);
    }

    setSaving(false);
    setSaved(true);
  }

  if (saved) {
    return (
      <p style={{ fontSize: 12, color: "var(--success)", marginTop: 8 }}>
        ✓ Insights saved from this note.
      </p>
    );
  }

  if (!open) {
    return (
      <button className="btn-ghost" style={{ fontSize: 12, marginTop: 8 }} onClick={() => setOpen(true)}>
        Extract JTBD Insights →
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
      }}
    >
      {extracted.length === 0 ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {personas.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              No personas yet — create one on the Research page first.
            </p>
          ) : (
            <>
              <select value={personaId} onChange={(e) => setPersonaId(e.target.value)}>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={extracting} />
              <button className="btn-primary" style={{ fontSize: 12 }} onClick={extract} disabled={extracting}>
                {extracting ? "Extracting…" : "Extract with AI"}
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
            {extracted.length} job statement(s) extracted from this note&apos;s raw
            content, same as an interview transcript.
          </p>
          <ul style={{ fontSize: 12, paddingLeft: 18, marginBottom: 8 }}>
            {extracted.map((js, i) => (
              <li key={i}>{js.statement}</li>
            ))}
          </ul>
          <button className="btn-primary" style={{ fontSize: 12 }} onClick={saveInsights} disabled={saving}>
            {saving ? "Saving…" : `Save ${extracted.length} Insights`}
          </button>
        </>
      )}
      {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
