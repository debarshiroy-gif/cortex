"use client";

import { useState } from "react";
import type { AuditTrailEntry } from "./types";

interface AuditTrailViewProps {
  requirementId: string;
}

const ACTION_LABEL: Record<string, string> = {
  drafted: "Drafted",
  flagged: "Flagged",
  verified: "Verified",
  signed_off: "Signed off",
};

export function AuditTrailView({ requirementId }: AuditTrailViewProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<AuditTrailEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (entries) return;
    setLoading(true);
    const res = await fetch(`/api/requirements/${requirementId}/audit-trail`);
    setEntries(await res.json());
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={toggle}>
          {open ? "Hide" : "View"} audit trail{entries ? ` (${entries.length})` : ""}
        </button>
        <a
          href={`/api/requirements/${requirementId}/audit-trail/export`}
          style={{ fontSize: 12 }}
        >
          Export report →
        </a>
      </div>

      {open && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            background: "var(--surface-2)",
            borderRadius: "var(--radius)",
          }}
        >
          {loading ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading…</p>
          ) : !entries || entries.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              No audit events yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {entries.map((entry) => (
                <div key={entry.id} style={{ fontSize: 12 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className={`badge badge-${entry.action}`}>
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {entry.actor} · {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {entry.note && (
                    <p style={{ marginTop: 2, color: "var(--text)" }}>{entry.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
