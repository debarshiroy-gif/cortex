"use client";

import { useEffect, useState } from "react";
import { RegimeWizard, type Regime } from "./RegimeWizard";
import { RequirementForm } from "./RequirementForm";
import { SourceExtractForm } from "./SourceExtractForm";
import { RequirementCard } from "./RequirementCard";
import type { Requirement } from "./types";

interface RequirementsPanelProps {
  featureId: string;
  initialRequirements?: Requirement[];
}

type FlowState = "idle" | "wizard" | "choice" | "form" | "form-ai";

export function RequirementsPanel({
  featureId,
  initialRequirements,
}: RequirementsPanelProps) {
  const [requirements, setRequirements] = useState<Requirement[]>(
    initialRequirements ?? []
  );
  const [loading, setLoading] = useState(!initialRequirements);
  const [flow, setFlow] = useState<FlowState>("idle");
  const [chosenRegime, setChosenRegime] = useState<Regime | null>(null);

  useEffect(() => {
    if (initialRequirements) return;
    fetch(`/api/requirements?featureId=${featureId}`)
      .then((r) => r.json())
      .then(setRequirements)
      .finally(() => setLoading(false));
  }, [featureId, initialRequirements]);

  function handleWizardComplete(regime: Regime) {
    setChosenRegime(regime);
    setFlow("choice");
  }

  function handleCreated(requirement: Requirement) {
    setRequirements((prev) => [...prev, requirement]);
    setFlow("idle");
    setChosenRegime(null);
  }

  function handleCreatedMany(created: Requirement[]) {
    setRequirements((prev) => [...prev, ...created]);
    setFlow("idle");
    setChosenRegime(null);
  }

  function handleUpdated(requirement: Requirement) {
    setRequirements((prev) =>
      prev.map((r) => (r.id === requirement.id ? requirement : r))
    );
  }

  function cancelFlow() {
    setFlow("idle");
    setChosenRegime(null);
  }

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600 }}>Requirements</h2>
        {flow === "idle" && (
          <button className="btn-ghost" onClick={() => setFlow("wizard")}>
            + Add Requirement
          </button>
        )}
      </div>

      {flow === "wizard" && (
        <div style={{ marginBottom: 16 }}>
          <RegimeWizard onComplete={handleWizardComplete} onCancel={cancelFlow} />
        </div>
      )}

      {flow === "choice" && chosenRegime && (
        <div className="card" style={{ marginBottom: 16, borderColor: "var(--accent)" }}>
          <p style={{ fontSize: 13, marginBottom: 12 }}>
            How do you want to create this{" "}
            {chosenRegime === "regulated" ? "regulated" : "non-regulated"} requirement?
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => setFlow("form-ai")}>
              Draft from source (AI)
            </button>
            <button className="btn-ghost" onClick={() => setFlow("form")}>
              Fill in manually
            </button>
            <button className="btn-ghost" onClick={cancelFlow}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {flow === "form" && chosenRegime && (
        <div style={{ marginBottom: 16 }}>
          <RequirementForm
            featureId={featureId}
            regime={chosenRegime}
            onCreated={handleCreated}
            onCancel={cancelFlow}
          />
        </div>
      )}

      {flow === "form-ai" && chosenRegime && (
        <div style={{ marginBottom: 16 }}>
          <SourceExtractForm
            featureId={featureId}
            regime={chosenRegime}
            onCreated={handleCreatedMany}
            onCancel={cancelFlow}
          />
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</p>
      ) : requirements.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          No requirements yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {requirements.map((requirement) => (
            <RequirementCard
              key={requirement.id}
              requirement={requirement}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
