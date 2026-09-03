"use client";

import { useState } from "react";
import { CommitExperimentForm } from "./CommitExperimentForm";
import { METHOD_LABEL } from "./methodLabels";
import type { ProposedExperiment, ResearchExperiment } from "./types";

interface ProposedExperimentCardProps {
  initiativeId: string;
  hasPrototype: boolean;
  prototypeVersionCount: number;
  proposal: ProposedExperiment;
  onCommitted: (experiment: ResearchExperiment) => void;
}

export function ProposedExperimentCard({
  initiativeId,
  hasPrototype,
  prototypeVersionCount,
  proposal,
  onCommitted,
}: ProposedExperimentCardProps) {
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);

  if (committed) {
    return (
      <p style={{ fontSize: 12, color: "var(--success)", marginTop: 6 }}>
        ✓ Committed as a planned experiment.
      </p>
    );
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        {METHOD_LABEL[proposal.method] ?? proposal.method}
      </div>
      <div style={{ fontSize: 12, marginBottom: 4 }}>{proposal.hypothesis}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
        Success metric: {proposal.successMetric}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{proposal.rationale}</div>

      {!committing ? (
        <button
          className="btn-ghost"
          style={{ fontSize: 12, marginTop: 8 }}
          onClick={() => setCommitting(true)}
        >
          Commit this experiment →
        </button>
      ) : (
        <CommitExperimentForm
          initiativeId={initiativeId}
          hasPrototype={hasPrototype}
          prototypeVersionCount={prototypeVersionCount}
          initialMethod={proposal.method}
          initialHypothesis={proposal.hypothesis}
          initialSuccessMetric={proposal.successMetric}
          onCommitted={(experiment) => {
            setCommitted(true);
            onCommitted(experiment);
          }}
          onCancel={() => setCommitting(false)}
        />
      )}
    </div>
  );
}
