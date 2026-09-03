"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrototypeGenerateForm } from "@/components/prototype/PrototypeGenerateForm";
import { PrototypeVersionCard } from "@/components/prototype/PrototypeVersionCard";
import type { PrototypeVersion } from "@/components/prototype/types";
import { useGreenfieldFlow } from "@/components/flow/useGreenfieldFlow";
import { GreenfieldFlowBar } from "@/components/flow/GreenfieldFlowBar";
import { FlowStepFooter } from "@/components/flow/FlowStepFooter";

interface InitiativeHeader {
  id: string;
  name: string;
  problemStatement: string | null;
}

export default function PrototypeInitiativePage() {
  const { initiativeId } = useParams<{ initiativeId: string }>();
  const [initiative, setInitiative] = useState<InitiativeHeader | null>(null);
  const [versions, setVersions] = useState<PrototypeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const { flow, refresh: refreshFlow } = useGreenfieldFlow(initiativeId);

  useEffect(() => {
    fetch(`/api/initiatives/${initiativeId}`)
      .then((r) => r.json())
      .then(setInitiative);

    fetch(`/api/prototype-versions?initiativeId=${initiativeId}`)
      .then((r) => r.json())
      .then(setVersions)
      .finally(() => setLoading(false));
  }, [initiativeId]);

  function handleCreated(version: PrototypeVersion) {
    setVersions((prev) => [...prev, version]);
    refreshFlow();
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  if (!initiative) {
    return <p style={{ color: "var(--text-muted)" }}>Loading…</p>;
  }

  const comparing = compareIds.length === 2;
  const compareVersions = versions.filter((v) => compareIds.includes(v.id));
  const newestFirst = [...versions].reverse();

  return (
    <div>
      {flow && <GreenfieldFlowBar flow={flow} />}

      <a href="/prototype" style={{ color: "var(--text-muted)", fontSize: 13 }}>
        ← Prototype
      </a>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
        Prototype: {initiative.name}
      </h1>
      {initiative.problemStatement && (
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          {initiative.problemStatement}
        </p>
      )}

      <div style={{ marginTop: 24, marginBottom: 32 }}>
        <PrototypeGenerateForm
          initiativeId={initiative.id}
          hasVersions={versions.length > 0}
          onCreated={handleCreated}
        />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>
            Versions {versions.length > 0 && `(${versions.length})`}
          </h2>
          {compareIds.length > 0 && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {compareIds.length}/2 selected to compare
            </span>
          )}
        </div>

        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</p>
        ) : versions.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No prototypes yet.</p>
        ) : comparing ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {compareVersions.map((v) => (
              <PrototypeVersionCard key={v.id} version={v} compareMode />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {newestFirst.map((v) => (
              <PrototypeVersionCard
                key={v.id}
                version={v}
                checked={compareIds.includes(v.id)}
                onToggleCheck={toggleCompare}
              />
            ))}
          </div>
        )}
      </div>

      {flow &&
        (() => {
          const step = flow.steps.find((s) => s.key === "prototype")!;
          const nextStep = flow.steps[flow.steps.findIndex((s) => s.key === "prototype") + 1];
          return (
            <FlowStepFooter
              initiativeId={initiative.id}
              stepKey="prototype"
              mandatory={step.mandatory}
              done={step.status === "done"}
              skipped={false}
              nextHref={nextStep.href}
              nextLabel={nextStep.label}
              onSkipped={() => {}}
            />
          );
        })()}
    </div>
  );
}
