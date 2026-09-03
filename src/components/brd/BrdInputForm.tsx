"use client";

import { useState } from "react";
import {
  CHANNEL_TYPE_LABEL,
  SOURCE_TEAM_LABEL,
  type BrdInput,
  type ChannelType,
  type SourceTeam,
} from "./types";

interface BrdInputFormProps {
  initiativeId: string;
  onCreated: (input: BrdInput) => void;
}

const SOURCE_TEAMS = Object.keys(SOURCE_TEAM_LABEL) as SourceTeam[];
const CHANNEL_TYPES = Object.keys(CHANNEL_TYPE_LABEL) as ChannelType[];

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function BrdInputForm({ initiativeId, onCreated }: BrdInputFormProps) {
  const [sourceTeam, setSourceTeam] = useState<SourceTeam>("compliance");
  const [channelType, setChannelType] = useState<ChannelType>("email_artifact");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [addedBy, setAddedBy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setContent("");
    setLink("");
    setFile(null);
  }

  async function submit() {
    setError(null);
    if (!content.trim() && !file && !link.trim()) {
      setError("Paste content, attach a file, or add a link");
      return;
    }
    setSaving(true);

    const fileBase64 = file ? await readFileAsBase64(file) : undefined;

    const res = await fetch("/api/brd-inputs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initiativeId,
        sourceTeam,
        channelType,
        content: content || undefined,
        link: link || undefined,
        fileName: file?.name,
        fileBase64,
        addedBy: addedBy || undefined,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
      return;
    }
    onCreated((await res.json()) as BrdInput);
    reset();
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Add a BRD Input</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              From
            </label>
            <select value={sourceTeam} onChange={(e) => setSourceTeam(e.target.value as SourceTeam)}>
              {SOURCE_TEAMS.map((t) => (
                <option key={t} value={t}>
                  {SOURCE_TEAM_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Channel
            </label>
            <select value={channelType} onChange={(e) => setChannelType(e.target.value as ChannelType)}>
              {CHANNEL_TYPES.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_TYPE_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {channelType !== "verbal_notes" && (
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Attach a file {channelType === "formal_brd_doc" ? "" : "(optional)"} — PDF or .txt
            </label>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {(channelType === "email_artifact" || channelType === "meeting_notes") && (
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              {channelType === "meeting_notes" ? "Google Doc link (optional)" : "Reference link (optional)"}
            </label>
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
            {channelType === "meeting_notes" && (
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                We store the link but don&apos;t fetch it yet — paste the notes below too, or attach
                the exported doc.
              </p>
            )}
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            {channelType === "verbal_notes" ? "What was said" : "Content (optional if a file is attached)"}
          </label>
          <textarea
            rows={channelType === "verbal_notes" ? 6 : 4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              channelType === "verbal_notes"
                ? "Summarize the verbal communication or your own notes…"
                : "Paste content here…"
            }
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            Added by
          </label>
          <input value={addedBy} onChange={(e) => setAddedBy(e.target.value)} placeholder="Your name" />
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

        <button className="btn-primary" onClick={submit} disabled={saving}>
          {saving ? "Saving…" : "Add Input"}
        </button>
      </div>
    </div>
  );
}
