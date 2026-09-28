"use client";

import { useState } from "react";
import { ProposedExperimentCard } from "./ProposedExperimentCard";
import type { ProposedExperiment, ResearchExperiment, ResearchMessage } from "./types";
import { ModelChoiceSelect } from "@/components/ModelChoiceSelect";
import { useModelChoice } from "@/lib/useModelChoice";

interface ResearchThreadProps {
  initiativeId: string;
  hasPrototype: boolean;
  prototypeVersionCount: number;
  initialMessages: ResearchMessage[];
  onExperimentCommitted: (experiment: ResearchExperiment) => void;
}

function parseProposals(json: string): ProposedExperiment[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ResearchThread({
  initiativeId,
  hasPrototype,
  prototypeVersionCount,
  initialMessages,
  onExperimentCommitted,
}: ResearchThreadProps) {
  const [messages, setMessages] = useState<ResearchMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useModelChoice();

  async function send(content: string) {
    if (!content.trim() || sending) return;
    setSending(true);
    setError(null);

    const res = await fetch(`/api/initiatives/${initiativeId}/research-messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, model: modelChoice }),
    });
    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to send");
      return;
    }

    const { pmMessage, aiMessage } = (await res.json()) as {
      pmMessage: ResearchMessage;
      aiMessage: ResearchMessage;
    };
    setMessages((prev) => [...prev, pmMessage, aiMessage]);
    setDraft("");
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Planning thread</h2>

      {messages.length === 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={sending} />
          <button
            className="btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() =>
              send(
                "I don't have a specific idea yet — please suggest some research directions for this initiative."
              )
            }
            disabled={sending}
          >
            Suggest research for me
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {messages.map((m) => {
          const proposals = m.role === "ai" ? parseProposals(m.proposedExperiments) : [];
          return (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === "pm" ? "flex-end" : "flex-start",
                maxWidth: "85%",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius)",
                  background: m.role === "pm" ? "var(--accent)" : "var(--surface-2)",
                  color: m.role === "pm" ? "#fff" : "var(--text)",
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content}
              </div>
              {proposals.map((p, i) => (
                <ProposedExperimentCard
                  key={i}
                  initiativeId={initiativeId}
                  hasPrototype={hasPrototype}
                  prototypeVersionCount={prototypeVersionCount}
                  proposal={p}
                  onCommitted={onExperimentCommitted}
                />
              ))}
            </div>
          );
        })}
        {sending && (
          <div style={{ alignSelf: "flex-start", fontSize: 12, color: "var(--text-muted)" }}>
            Cortex is thinking…
          </div>
        )}
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 12, marginBottom: 8 }}>{error}</p>}

      <div style={{ marginBottom: 8 }}>
        <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={sending} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          rows={2}
          placeholder="Describe an idea, ask for an opinion, or push back on a suggestion…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
        />
        <button
          className="btn-primary"
          style={{ flexShrink: 0 }}
          onClick={() => send(draft)}
          disabled={sending || !draft.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
