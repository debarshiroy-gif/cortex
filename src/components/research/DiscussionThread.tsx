"use client";

import { useState } from "react";
import type { ResearchExperiment } from "./types";

interface DiscussionTurn {
  role: "pm" | "ai";
  content: string;
}

interface DiscussionThreadProps {
  experiment: ResearchExperiment;
  onUpdated: (experiment: ResearchExperiment) => void;
  label?: string;
}

function parseThread(json: string): DiscussionTurn[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function DiscussionThread({ experiment, onUpdated, label }: DiscussionThreadProps) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thread = parseThread(experiment.discussionThread);

  async function send(content?: string) {
    setSending(true);
    setError(null);
    const res = await fetch(`/api/experiments/${experiment.id}/discuss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content ? { content } : {}),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to send");
      return;
    }
    onUpdated((await res.json()) as ResearchExperiment);
    setDraft("");
  }

  if (thread.length === 0) {
    return (
      <div style={{ marginTop: 8 }}>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => send()} disabled={sending}>
          {sending ? "Thinking…" : label ?? "Discuss with AI"}
        </button>
        {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {thread.map((t, i) => (
          <div
            key={i}
            style={{
              alignSelf: t.role === "pm" ? "flex-end" : "flex-start",
              maxWidth: "90%",
              padding: "8px 12px",
              borderRadius: "var(--radius)",
              background: t.role === "pm" ? "var(--accent)" : "var(--surface-2)",
              color: t.role === "pm" ? "#fff" : "var(--text)",
              fontSize: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {t.content}
          </div>
        ))}
        {sending && (
          <div style={{ alignSelf: "flex-start", fontSize: 11, color: "var(--text-muted)" }}>
            Thinking…
          </div>
        )}
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p>}

      <div style={{ display: "flex", gap: 6 }}>
        <input
          placeholder="Reply…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) send(draft);
          }}
          style={{ flex: 1, fontSize: 12 }}
        />
        <button
          className="btn-ghost"
          style={{ fontSize: 12 }}
          onClick={() => send(draft)}
          disabled={sending || !draft.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
