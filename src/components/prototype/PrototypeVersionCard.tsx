"use client";

import { useState } from "react";
import { SOURCE_MODE_LABEL, type PrototypeVersion } from "./types";
import { readabilityBand } from "@/lib/readability";

interface PrototypeVersionCardProps {
  version: PrototypeVersion;
  compareMode?: boolean;
  checked?: boolean;
  onToggleCheck?: (id: string) => void;
}

export function PrototypeVersionCard({
  version,
  compareMode,
  checked,
  onToggleCheck,
}: PrototypeVersionCardProps) {
  const [expanded, setExpanded] = useState(compareMode ?? false);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onToggleCheck && (
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={!!checked}
              onChange={() => onToggleCheck(version.id)}
            />
          )}
          <span style={{ fontWeight: 600, fontSize: 13 }}>v{version.versionNumber}</span>
          <span className={`badge badge-${version.kind === "ui" ? "approved" : "draft"}`}>
            {version.kind}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {SOURCE_MODE_LABEL[version.sourceMode]}
          </span>
          {version.readabilityScore != null && (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Readability: {version.readabilityScore} — {readabilityBand(version.readabilityScore)}
            </span>
          )}
        </div>
        <button className="btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Collapse" : "View"}
        </button>
      </div>

      {version.promptText && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, fontStyle: "italic" }}>
          &ldquo;{version.promptText}&rdquo;
        </p>
      )}

      {expanded && (
        <div style={{ marginTop: 12 }}>
          {version.kind === "ui" ? (
            <iframe
              srcDoc={version.content}
              sandbox="allow-scripts"
              style={{
                width: "100%",
                height: 500,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                background: "#fff",
              }}
              title={`Prototype v${version.versionNumber}`}
            />
          ) : (
            <div
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: 12,
                lineHeight: 1.6,
                background: "var(--surface-2)",
                padding: 12,
                borderRadius: "var(--radius)",
                maxHeight: 500,
                overflowY: "auto",
              }}
            >
              {version.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
