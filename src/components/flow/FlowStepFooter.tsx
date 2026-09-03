"use client";

import { useState } from "react";
import type { FlowStepKey } from "@/lib/greenfieldFlow";

interface FlowStepFooterProps {
  initiativeId: string;
  stepKey: FlowStepKey;
  mandatory: boolean;
  done: boolean;
  skipped: boolean;
  nextHref: string;
  nextLabel: string;
  isLastStep?: boolean;
  onSkipped: () => void;
}

export function FlowStepFooter({
  initiativeId,
  stepKey,
  mandatory,
  done,
  skipped,
  nextHref,
  nextLabel,
  isLastStep,
  onSkipped,
}: FlowStepFooterProps) {
  const [skipping, setSkipping] = useState(false);

  async function skip() {
    setSkipping(true);
    const body = stepKey === "research" ? { skipResearchAndStrategy: true } : { skipStep: stepKey };
    const res = await fetch(`/api/initiatives/${initiativeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSkipping(false);
    if (res.ok) onSkipped();
  }

  if ((done || skipped) && isLastStep) {
    return (
      <p style={{ marginTop: 16, fontSize: 13, color: "var(--success)", fontWeight: 600 }}>
        🎉 Greenfield pipeline complete.
      </p>
    );
  }

  if (done || skipped) {
    return (
      <div style={{ marginTop: 16 }}>
        <a href={nextHref} style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ fontSize: 12 }}>
            Continue to {nextLabel} →
          </button>
        </a>
      </div>
    );
  }

  if (!mandatory) {
    return (
      <div style={{ marginTop: 16 }}>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={skip} disabled={skipping}>
          {skipping ? "Skipping…" : "Skip this step →"}
        </button>
      </div>
    );
  }

  return null;
}
