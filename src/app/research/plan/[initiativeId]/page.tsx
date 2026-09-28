"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ResearchThread } from "@/components/research/ResearchThread";
import { CommittedExperimentsList } from "@/components/research/CommittedExperimentsList";
import { CommitExperimentForm } from "@/components/research/CommitExperimentForm";
import { StrategyGateBanner } from "@/components/research/StrategyGateBanner";
import { useGreenfieldFlow } from "@/components/flow/useGreenfieldFlow";
import { GreenfieldFlowBar } from "@/components/flow/GreenfieldFlowBar";
import { FlowStepFooter } from "@/components/flow/FlowStepFooter";
import type { InitiativeResearchSummary, ResearchExperiment, ResearchMessage } from "@/components/research/types";

interface InitiativeDetail extends InitiativeResearchSummary {
  problemStatement: string | null;
  researchMessages: ResearchMessage[];
}

export default function ResearchPlanPage() {
  const { initiativeId } = useParams<{ initiativeId: string }>();
  const [initiative, setInitiative] = useState<InitiativeDetail | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [prototypeVersionCount, setPrototypeVersionCount] = useState(0);
  const hasPrototype = prototypeVersionCount > 0;
  const { flow, refresh: refreshFlow } = useGreenfieldFlow(initiativeId);

  useEffect(() => {
    fetch(`/api/initiatives/${initiativeId}`)
      .then((r) => r.json())
      .then((found: InitiativeDetail) => {
        setInitiative(found);
        // Landing on this page means research was needed — heal any
        // initiative still stuck at "undecided" (e.g. from before the
        // "Yes, plan research" button was fixed to persist this), so the
        // Strategy Gate below can actually appear.
        if (found.researchGateStatus === "undecided") {
          fetch(`/api/initiatives/${initiativeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ researchGateStatus: "needed" }),
          })
            .then((r) => r.json())
            .then((updated) => {
              setInitiative(
                (prev) =>
                  prev && {
                    ...prev,
                    researchGateStatus: updated.researchGateStatus,
                    researchSkipReason: updated.researchSkipReason,
                  }
              );
              refreshFlow();
            });
        }
      });

    fetch(`/api/prototype-versions?initiativeId=${initiativeId}`)
      .then((r) => r.json())
      .then((versions: unknown[]) => setPrototypeVersionCount(versions.length))
      .catch(() => setPrototypeVersionCount(0));
  }, [initiativeId]);

  function handleExperimentCommitted(experiment: ResearchExperiment) {
    setInitiative((prev) => prev && { ...prev, experiments: [experiment, ...prev.experiments] });
    setShowManualForm(false);
  }

  function handleExperimentUpdated(experiment: ResearchExperiment) {
    setInitiative(
      (prev) =>
        prev && {
          ...prev,
          experiments: prev.experiments.map((e) => (e.id === experiment.id ? experiment : e)),
        }
    );
  }

  if (!initiative) {
    return <p style={{ color: "var(--text-muted)" }}>Loading…</p>;
  }

  return (
    <div>
      <a href="/research" style={{ color: "var(--text-muted)", fontSize: 13 }}>
        ← Research
      </a>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
        Research plan: {initiative.name}
      </h1>
      {initiative.problemStatement && (
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          {initiative.problemStatement}
        </p>
      )}

      {flow && <GreenfieldFlowBar flow={flow} />}

      <StrategyGateBanner
        initiative={initiative}
        onUpdated={(patch) => {
          setInitiative((prev) => prev && { ...prev, ...patch });
          refreshFlow();
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginTop: 24,
          alignItems: "start",
        }}
      >
        <div>
          <ResearchThread
            initiativeId={initiative.id}
            hasPrototype={hasPrototype}
            prototypeVersionCount={prototypeVersionCount}
            initialMessages={initiative.researchMessages}
            onExperimentCommitted={handleExperimentCommitted}
          />
        </div>

        <div
          className="card"
          style={{ position: "sticky", top: 24, maxHeight: "calc(100vh - 48px)", display: "flex", flexDirection: "column" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Committed experiments</h2>
            {!showManualForm && (
              <button
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => setShowManualForm(true)}
              >
                I already know what to run
              </button>
            )}
          </div>

          {showManualForm && (
            <CommitExperimentForm
              initiativeId={initiative.id}
              hasPrototype={hasPrototype}
              prototypeVersionCount={prototypeVersionCount}
              onCommitted={handleExperimentCommitted}
              onCancel={() => setShowManualForm(false)}
            />
          )}

          <div style={{ marginTop: showManualForm ? 16 : 0, overflowY: "auto" }}>
            <CommittedExperimentsList
              experiments={initiative.experiments}
              onUpdated={handleExperimentUpdated}
            />
          </div>
        </div>
      </div>

      {flow &&
        (() => {
          const step = flow.steps.find((s) => s.key === "research")!;
          const nextStep = flow.steps[flow.steps.findIndex((s) => s.key === "research") + 1];
          return (
            <FlowStepFooter
              initiativeId={initiative.id}
              stepKey="research"
              mandatory={step.mandatory}
              done={step.status === "done"}
              skipped={step.status === "skipped"}
              nextHref={nextStep.href}
              nextLabel={nextStep.label}
              onSkipped={() => {
                refreshFlow();
                fetch(`/api/initiatives/${initiativeId}`)
                  .then((r) => r.json())
                  .then((found: InitiativeDetail) => setInitiative(found));
              }}
            />
          );
        })()}
    </div>
  );
}
