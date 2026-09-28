"use client";

import { useState } from "react";
import { CHANNEL_TYPE_LABEL, SOURCE_TEAM_LABEL, type BrdInput } from "./types";

interface BrdInputCardProps {
  input: BrdInput;
  onUpdated: (input: BrdInput) => void;
}

export function BrdInputCard({ input, onUpdated }: BrdInputCardProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(input.content);
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/brd-inputs/${input.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) onUpdated((await res.json()) as BrdInput);
  }

  async function saveAndApprove() {
    await patch({ content, status: "approved" });
    setEditing(false);
  }

  return (
    <div className="card" style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge badge-idea">{SOURCE_TEAM_LABEL[input.sourceTeam]}</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {CHANNEL_TYPE_LABEL[input.channelType]}
          </span>
          <span
            className={`badge badge-${
              input.status === "approved" ? "approved" : input.status === "rejected" ? "killed" : "draft"
            }`}
          >
            {input.status}
          </span>
          {input.consideredInBrdAt && (
            <span className="badge badge-verified" style={{ fontSize: 10 }}>
              ✓ Considered for BRD draft
            </span>
          )}
        </div>
        {input.status === "suggested" && !editing && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setEditing(true)}>
              Review
            </button>
            <button
              className="btn-ghost"
              style={{ fontSize: 11, padding: "4px 10px" }}
              onClick={() => patch({ status: "rejected" })}
              disabled={saving}
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {input.link && (
        <a href={input.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
          {input.link}
        </a>
      )}
      {input.fileName && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>File: {input.fileName}</p>
      )}

      {editing ? (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" style={{ fontSize: 12 }} onClick={saveAndApprove} disabled={saving}>
              {saving ? "Saving…" : "Save & Approve"}
            </button>
            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        input.content && (
          <p style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>
            {input.content.length > 400 ? `${input.content.slice(0, 400)}…` : input.content}
          </p>
        )
      )}

      {input.addedBy && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>added by {input.addedBy}</p>
      )}
    </div>
  );
}
