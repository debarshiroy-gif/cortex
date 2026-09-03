"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PrdStoryList } from "@/components/prd/PrdStoryList";
import type { Prd, PrdStory } from "@/components/prd/types";
import { VALIDATION_METHODS } from "@/components/research/methodLabels";
import type { ResearchExperiment } from "@/components/research/types";
import { useGreenfieldFlow } from "@/components/flow/useGreenfieldFlow";
import { GreenfieldFlowBar } from "@/components/flow/GreenfieldFlowBar";
import { FlowStepFooter } from "@/components/flow/FlowStepFooter";

interface InitiativeHeader {
  id: string;
  name: string;
  problemStatement: string | null;
  projectType: string;
  baselineInitiative: { id: string; name: string } | null;
}

interface Brd {
  status: string;
}

function parseStories(json: string): PrdStory[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function PrdInitiativePage() {
  const { initiativeId } = useParams<{ initiativeId: string }>();
  const [initiative, setInitiative] = useState<InitiativeHeader | null>(null);
  const [brd, setBrd] = useState<Brd | null>(null);
  const [prototypeCount, setPrototypeCount] = useState(0);
  const [validationCount, setValidationCount] = useState(0);
  const [markingStatus, setMarkingStatus] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const [prd, setPrd] = useState<Prd | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { flow, refresh: refreshFlow } = useGreenfieldFlow(initiativeId);

  useEffect(() => {
    fetch(`/api/initiatives/${initiativeId}`)
      .then((r) => r.json())
      .then(setInitiative);

    fetch(`/api/brd?initiativeId=${initiativeId}`)
      .then((r) => r.json())
      .then(setBrd);

    fetch(`/api/prototype-versions?initiativeId=${initiativeId}`)
      .then((r) => r.json())
      .then((versions: unknown[]) => setPrototypeCount(versions.length));

    fetch(`/api/experiments?initiativeId=${initiativeId}`)
      .then((r) => r.json())
      .then((experiments: ResearchExperiment[]) =>
        setValidationCount(
          experiments.filter(
            (e) =>
              e.status === "completed" &&
              (VALIDATION_METHODS as readonly string[]).includes(e.method)
          ).length
        )
      );

    fetch(`/api/prd?initiativeId=${initiativeId}`)
      .then((r) => r.json())
      .then(setPrd);
  }, [initiativeId]);

  async function markStatus(status: string) {
    if (!prd) return;
    setMarkingStatus(true);
    const res = await fetch(`/api/prd/${prd.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setMarkingStatus(false);
    if (res.ok) setPrd((await res.json()) as Prd);
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    const res = await fetch("/api/prd/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initiativeId }),
    });
    setGenerating(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to generate PRD");
      return;
    }
    setPrd((await res.json()) as Prd);
    setEditing(false);
    refreshFlow();
  }

  async function save() {
    if (!prd) return;
    setSaving(true);
    const res = await fetch(`/api/prd/${prd.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draftContent }),
    });
    setSaving(false);
    if (res.ok) {
      setPrd((await res.json()) as Prd);
      setEditing(false);
    }
  }

  async function mergeIntoMaster() {
    if (!prd) return;
    setMerging(true);
    setMergeError(null);
    const res = await fetch(`/api/prd/${prd.id}/merge-into-master`, { method: "POST" });
    setMerging(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMergeError(data.error ?? "Failed to merge into master");
      return;
    }
    setPrd((prev) => prev && { ...prev, mergedIntoMaster: true });
  }

  if (!initiative) {
    return <p style={{ color: "var(--text-muted)" }}>Loading…</p>;
  }

  const stories = prd ? parseStories(prd.stories) : [];

  return (
    <div>
      {flow && <GreenfieldFlowBar flow={flow} />}

      <a href="/prd" style={{ color: "var(--text-muted)", fontSize: 13 }}>
        ← PRD
      </a>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>PRD: {initiative.name}</h1>
      {initiative.problemStatement && (
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          {initiative.problemStatement}
        </p>
      )}
      {initiative.baselineInitiative && (
        <p style={{ fontSize: 13, marginTop: 4 }}>
          Enhancing:{" "}
          <a href={`/prd/initiative/${initiative.baselineInitiative.id}`}>
            {initiative.baselineInitiative.name} →
          </a>
        </p>
      )}

      <div
        style={{
          marginTop: 16,
          marginBottom: 24,
          padding: "10px 14px",
          background: "var(--surface-2)",
          borderRadius: "var(--radius)",
          fontSize: 12,
          color: "var(--text-muted)",
          display: "flex",
          gap: 16,
        }}
      >
        <span>BRD: {brd?.status ?? "not drafted"}</span>
        <span>Prototype versions: {prototypeCount}</span>
        <span>Completed validation experiments: {validationCount}</span>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Document</h2>
            {prd && <span className={`badge badge-${prd.status}`}>{prd.status}</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {prd?.content && !editing && (
              <button
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => {
                  setDraftContent(prd.content ?? "");
                  setEditing(true);
                }}
              >
                Edit
              </button>
            )}
            {prd?.content && (
              <a href={`/api/prd/${prd.id}/export`}>
                <button className="btn-ghost" style={{ fontSize: 12 }}>
                  Export .md
                </button>
              </a>
            )}
            {prd?.content && !editing && prd.status === "draft" && (
              <button
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => markStatus("released")}
                disabled={markingStatus}
              >
                {markingStatus ? "Saving…" : "Mark as Released"}
              </button>
            )}
            {prd?.content && !editing && initiative.baselineInitiative && (
              <button
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={mergeIntoMaster}
                disabled={merging}
              >
                {merging ? "Merging…" : prd.mergedIntoMaster ? "Re-merge into Master PRD" : "Merge into Master PRD"}
              </button>
            )}
            {prd?.content && !editing && (
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={generate} disabled={generating}>
                {generating ? "Regenerating…" : "Regenerate with AI"}
              </button>
            )}
          </div>
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{error}</p>}
        {mergeError && <p style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{mergeError}</p>}

        {!prd?.content && !editing && (
          <div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
              No draft yet. Cortex will pull in the BRD, validation findings, and any prototypes
              built so far.
            </p>
            <button className="btn-primary" onClick={generate} disabled={generating}>
              {generating ? "Generating…" : "Generate PRD"}
            </button>
          </div>
        )}

        {prd?.content && !editing && (
          <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 13, lineHeight: 1.7 }}>
            {prd.content}
          </div>
        )}

        {editing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              rows={24}
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="btn-ghost" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {prd && (
        <PrdStoryList
          prdId={prd.id}
          initialStories={stories}
          onSaved={(updated) => setPrd((prev) => prev && { ...prev, stories: JSON.stringify(updated) })}
        />
      )}

      {flow &&
        (() => {
          const step = flow.steps.find((s) => s.key === "prd")!;
          return (
            <FlowStepFooter
              initiativeId={initiative.id}
              stepKey="prd"
              mandatory={step.mandatory}
              done={step.status === "done"}
              skipped={false}
              nextHref=""
              nextLabel=""
              isLastStep
              onSkipped={() => {}}
            />
          );
        })()}
    </div>
  );
}
