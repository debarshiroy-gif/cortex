"use client";

import type { FlowStatusResult } from "@/lib/greenfieldFlow";

const STATUS_ICON: Record<string, string> = {
  done: "✓",
  skipped: "⊘",
  current: "●",
  upcoming: "○",
  blocked: "✕",
};

const STATUS_COLOR: Record<string, string> = {
  done: "var(--success)",
  skipped: "var(--text-muted)",
  current: "var(--accent)",
  upcoming: "var(--text-muted)",
  blocked: "var(--danger)",
};

export function GreenfieldFlowBar({ flow }: { flow: FlowStatusResult }) {
  if (flow.blocked) {
    return (
      <div
        style={{
          marginBottom: 20,
          padding: "10px 14px",
          background: "var(--surface-2)",
          border: "1px solid var(--danger)",
          borderRadius: "var(--radius)",
          fontSize: 13,
          color: "var(--danger)",
        }}
      >
        This initiative was killed at the Strategy Gate — the flow has stopped here.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
        marginBottom: 20,
        fontSize: 12,
      }}
    >
      {flow.steps.map((step, i) => (
        <span key={step.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <a
            href={step.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              color: STATUS_COLOR[step.status],
              fontWeight: step.status === "current" ? 600 : 400,
            }}
          >
            <span>{STATUS_ICON[step.status]}</span>
            <span>
              {step.label}
              {!step.mandatory && " (optional)"}
            </span>
          </a>
          {i < flow.steps.length - 1 && <span style={{ color: "var(--text-muted)" }}>→</span>}
        </span>
      ))}
    </div>
  );
}
