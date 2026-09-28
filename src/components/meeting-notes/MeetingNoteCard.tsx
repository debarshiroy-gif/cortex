"use client";

import { useState } from "react";
import { MeetingNoteExtract } from "./MeetingNoteExtract";
import type { MeetingNote } from "./types";

interface MeetingNoteCardProps {
  note: MeetingNote;
  productId: string;
  onUpdated: (note: MeetingNote) => void;
}

const SOURCE_LABEL: Record<string, string> = {
  gemini_notes: "Gemini notes",
  slack_thread: "Slack thread",
  freetext: "Free text",
};

const NOTETAKER_LABEL: Record<string, string> = {
  yes: "Gemini notetaker: Yes",
  no: "Gemini notetaker: No",
  not_applicable: "Gemini notetaker: N/A",
};

export function MeetingNoteCard({ note, productId, onUpdated }: MeetingNoteCardProps) {
  const [saving, setSaving] = useState(false);
  const [addingContent, setAddingContent] = useState(false);
  const [contentDraft, setContentDraft] = useState("");
  const attendees = (() => {
    try {
      const parsed = JSON.parse(note.attendees);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  })();

  async function setStatus(status: "approved" | "rejected") {
    setSaving(true);
    const res = await fetch(`/api/meeting-notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    if (res.ok) onUpdated((await res.json()) as MeetingNote);
  }

  async function saveContent() {
    if (!contentDraft.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/meeting-notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawContent: contentDraft }),
    });
    setSaving(false);
    if (res.ok) {
      onUpdated((await res.json()) as MeetingNote);
      setAddingContent(false);
    }
  }

  return (
    <div className="card" style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge badge-idea">{SOURCE_LABEL[note.sourceType]}</span>
          <span
            className={`badge badge-${
              note.status === "approved" ? "approved" : note.status === "rejected" ? "killed" : "draft"
            }`}
          >
            {note.status}
          </span>
          {note.consideredInBrdAt && (
            <span className="badge badge-verified" style={{ fontSize: 10 }}>
              ✓ Considered for BRD draft
            </span>
          )}
          {note.relevanceScore != null && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              relevance {note.relevanceScore.toFixed(2)}
            </span>
          )}
          {note.meetingDate && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {new Date(note.meetingDate).toLocaleDateString()}
            </span>
          )}
        </div>
        {note.status === "suggested" && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button className="btn-primary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setStatus("approved")} disabled={saving}>
              Approve
            </button>
            <button className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setStatus("rejected")} disabled={saving}>
              Reject
            </button>
          </div>
        )}
      </div>

      {note.link && (
        <a href={note.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
          {note.link}
        </a>
      )}

      {note.rawContent && (
        <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>
          {note.rawContent.length > 400 ? `${note.rawContent.slice(0, 400)}…` : note.rawContent}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        {attendees.length > 0 && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {attendees.join(", ")}
          </span>
        )}
        {note.addedBy && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            added by {note.addedBy}
          </span>
        )}
        {note.geminiNotetakerEnabled && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {NOTETAKER_LABEL[note.geminiNotetakerEnabled]}
          </span>
        )}
      </div>

      {note.status === "approved" &&
        (note.linkedInsightId ? (
          <p style={{ fontSize: 12, color: "var(--success)", marginTop: 8 }}>
            ✓ Linked to an insight
          </p>
        ) : note.rawContent.trim() ? (
          <MeetingNoteExtract
            note={note}
            productId={productId}
            onLinked={(insightId) => onUpdated({ ...note, linkedInsightId: insightId })}
          />
        ) : addingContent ? (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <textarea
              rows={4}
              placeholder="Paste the meeting notes or transcript text here…"
              value={contentDraft}
              onChange={(e) => setContentDraft(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-primary"
                style={{ fontSize: 12 }}
                onClick={saveContent}
                disabled={saving || !contentDraft.trim()}
              >
                {saving ? "Saving…" : "Save content"}
              </button>
              <button
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => setAddingContent(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              No content to extract from yet — this note only stores a link.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
              <button
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => setAddingContent(true)}
              >
                Paste content manually
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
