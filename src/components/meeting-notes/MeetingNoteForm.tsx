"use client";

import { useEffect, useState } from "react";
import type {
  InitiativeOption,
  MeetingNote,
  NotetakerEnabled,
  SourceType,
} from "./types";

interface MeetingNoteFormProps {
  productId: string;
  initiativeId?: string;
  onCreated: (note: MeetingNote) => void;
}

export function MeetingNoteForm({ productId, initiativeId, onCreated }: MeetingNoteFormProps) {
  const [sourceType, setSourceType] = useState<SourceType>("freetext");
  const [link, setLink] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [attendees, setAttendees] = useState("");
  const [addedBy, setAddedBy] = useState("");

  const [initiatives, setInitiatives] = useState<InitiativeOption[]>([]);
  const [linkedInitiativeId, setLinkedInitiativeId] = useState(initiativeId ?? "");
  const [notetakerEnabled, setNotetakerEnabled] = useState<NotetakerEnabled | "">("");

  const [markSuggested, setMarkSuggested] = useState(false);
  const [relevanceScore, setRelevanceScore] = useState("0.5");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/initiatives?productId=${productId}`)
      .then((r) => r.json())
      .then((data: InitiativeOption[]) => setInitiatives(data))
      .catch(() => setInitiatives([]));
  }, [productId]);

  // Arriving at Meeting Notes via the guided flow (?initiativeId=) should
  // default the link so a note actually counts toward that initiative's
  // flow progress without the PM having to remember to pick it manually.
  useEffect(() => {
    if (initiativeId) setLinkedInitiativeId(initiativeId);
  }, [initiativeId]);

  function reset() {
    setLink("");
    setRawContent("");
    setMeetingDate("");
    setAttendees("");
    setLinkedInitiativeId(initiativeId ?? "");
    setNotetakerEnabled("");
    setMarkSuggested(false);
    setRelevanceScore("0.5");
  }

  async function submit() {
    setError(null);

    if (sourceType === "freetext" && !rawContent.trim()) {
      setError("Paste the meeting notes first");
      return;
    }
    if (sourceType !== "freetext" && !link.trim()) {
      setError("A link is required for a Gemini notes doc or Slack thread");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/meeting-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType,
        link: sourceType === "freetext" ? undefined : link,
        rawContent,
        meetingDate: meetingDate || undefined,
        attendees: attendees
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        addedBy: addedBy || undefined,
        linkedInitiativeId: linkedInitiativeId || undefined,
        geminiNotetakerEnabled: linkedInitiativeId
          ? notetakerEnabled || undefined
          : undefined,
        status: markSuggested ? "suggested" : "approved",
        relevanceScore: markSuggested ? relevanceScore : undefined,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save meeting note");
      return;
    }

    onCreated((await res.json()) as MeetingNote);
    reset();
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
        Add a Meeting Note
      </h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(
          [
            { value: "freetext", label: "Paste notes" },
            { value: "gemini_notes", label: "Gemini notes link" },
            { value: "slack_thread", label: "Slack thread link" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            className={sourceType === opt.value ? "btn-primary" : "btn-ghost"}
            style={{ fontSize: 12 }}
            onClick={() => setSourceType(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sourceType !== "freetext" && (
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              {sourceType === "gemini_notes" ? "Gemini notes doc link" : "Slack thread permalink"}
            </label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
            />
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              We just store the link for now — fetching the content automatically is
              a stretch goal, not required for v1.
            </p>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            {sourceType === "freetext" ? "Meeting notes" : "Context (optional)"}
          </label>
          <textarea
            rows={sourceType === "freetext" ? 8 : 3}
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            placeholder={
              sourceType === "freetext"
                ? "Paste raw meeting notes here…"
                : "Add any context a teammate would need, e.g. why this thread matters…"
            }
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Meeting date
            </label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Attendees (comma-separated)
            </label>
            <input value={attendees} onChange={(e) => setAttendees(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Added by
            </label>
            <input value={addedBy} onChange={(e) => setAddedBy(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Linked initiative (optional)
            </label>
            <select
              value={linkedInitiativeId}
              onChange={(e) => setLinkedInitiativeId(e.target.value)}
            >
              <option value="">— none —</option>
              {initiatives.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {linkedInitiativeId && (
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Was Gemini notetaker enabled for this meeting?
            </label>
            <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
              {(
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "not_applicable", label: "N/A" },
                ] as const
              ).map((opt) => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="radio"
                    style={{ width: "auto" }}
                    checked={notetakerEnabled === opt.value}
                    onChange={() => setNotetakerEnabled(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            padding: 10,
            background: "var(--surface-2)",
            borderRadius: "var(--radius)",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={markSuggested}
              onChange={(e) => setMarkSuggested(e.target.checked)}
            />
            Add as <strong>Suggested</strong> instead (for testing the inbox below)
          </label>
          {markSuggested && (
            <div style={{ marginTop: 8 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                Relevance score (0–1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={relevanceScore}
                onChange={(e) => setRelevanceScore(e.target.value)}
                style={{ width: 100 }}
              />
            </div>
          )}
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

        <button className="btn-primary" onClick={submit} disabled={saving}>
          {saving ? "Saving…" : markSuggested ? "Add as Suggested" : "Add Meeting Note"}
        </button>
      </div>
    </div>
  );
}
