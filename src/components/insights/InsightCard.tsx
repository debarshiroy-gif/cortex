"use client";

import { useState } from "react";
import { ExperimentManager } from "./ExperimentManager";
import { PromoteToRequirement } from "./PromoteToRequirement";
import type { Experiment } from "./types";

interface InsightCardProps {
  insightId: string;
  summary: string;
  tags: string[];
  confidence: string;
  productId: string;
}

const CONF_LABEL: Record<string, string> = {
  high: "🟢 high",
  med: "🟡 med",
  low: "🔴 low",
};

export function InsightCard({
  insightId,
  summary,
  tags,
  confidence,
  productId,
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [experiments, setExperiments] = useState<Experiment[] | null>(null);

  async function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && experiments === null) {
      const res = await fetch(`/api/experiments?insightId=${insightId}`);
      setExperiments(await res.json());
    }
  }

  return (
    <div
      className="card"
      style={{ padding: "10px 14px", cursor: "pointer" }}
      onClick={!expanded ? toggle : undefined}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <p style={{ fontSize: 13, flex: 1 }}>{summary}</p>
        <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
          {CONF_LABEL[confidence] ?? confidence}
        </span>
      </div>

      {tags.length > 0 && (
        <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 99,
                background: "var(--surface-2)",
                color: "var(--text-muted)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div
          style={{ marginTop: 10, cursor: "default" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
            Experiments
          </div>
          <ExperimentManager
            insightId={insightId}
            experiments={experiments ?? []}
            onCreated={(exp) => setExperiments((prev) => [exp, ...(prev ?? [])])}
          />

          <PromoteToRequirement
            insightId={insightId}
            productId={productId}
            experiments={experiments ?? []}
          />

          <button
            className="btn-ghost"
            style={{ fontSize: 11, marginTop: 8 }}
            onClick={toggle}
          >
            Collapse
          </button>
        </div>
      )}
    </div>
  );
}
