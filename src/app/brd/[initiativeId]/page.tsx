"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BrdInputForm } from "@/components/brd/BrdInputForm";
import { BrdInputCard } from "@/components/brd/BrdInputCard";
import { SOURCE_TEAM_LABEL, type BrdInput, type SourceTeam } from "@/components/brd/types";
import { useGreenfieldFlow } from "@/components/flow/useGreenfieldFlow";
import { GreenfieldFlowBar } from "@/components/flow/GreenfieldFlowBar";
import { FlowStepFooter } from "@/components/flow/FlowStepFooter";

interface InitiativeHeader {
  id: string;
  name: string;
  problemStatement: string | null;
}

interface Brd {
  id: string;
  content: string | null;
  status: string;
  updatedAt: string;
}

export default function BrdInitiativePage() {
  const { initiativeId } = useParams<{ initiativeId: string }>();
  const [initiative, setInitiative] = useState<InitiativeHeader | null>(null);
  const [inputs, setInputs] = useState<BrdInput[]>([]);
  const [loading, setLoading] = useState(true);

  const [brd, setBrd] = useState<Brd | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingBrd, setEditingBrd] = useState(false);
  const { flow, refresh: refreshFlow } = useGreenfieldFlow(initiativeId);
  const [draftContent, setDraftContent] = useState("");
  const [savingBrd, setSavingBrd] = useState(false);
  const [brdError, setBrdError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/initiatives/${initiativeId}`)
      .then((r) => r.json())
      .then(setInitiative);

    fetch(`/api/brd-inputs?initiativeId=${initiativeId}`)
      .then((r) => r.json())
      .then(setInputs)
      .finally(() => setLoading(false));

    fetch(`/api/brd?initiativeId=${initiativeId}`)
      .then((r) => r.json())
      .then(setBrd);
  }, [initiativeId]);

  async function generateBrd() {
    setGenerating(true);
    setBrdError(null);
    const res = await fetch("/api/brd/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initiativeId }),
    });
    setGenerating(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setBrdError(data.error ?? "Failed to generate BRD");
      return;
    }
    setBrd((await res.json()) as Brd);
    setEditingBrd(false);
    refreshFlow();
  }

  async function saveBrd() {
    if (!brd) return;
    setSavingBrd(true);
    const res = await fetch(`/api/brd/${brd.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draftContent }),
    });
    setSavingBrd(false);
    if (res.ok) {
      setBrd((await res.json()) as Brd);
      setEditingBrd(false);
    }
  }

  function handleCreated(input: BrdInput) {
    setInputs((prev) => [input, ...prev]);
  }

  function handleUpdated(input: BrdInput) {
    setInputs((prev) => prev.map((i) => (i.id === input.id ? input : i)));
  }

  const suggested = inputs.filter((i) => i.status === "suggested");
  const approved = inputs.filter((i) => i.status === "approved");
  const byTeam = approved.reduce<Record<string, BrdInput[]>>((acc, i) => {
    (acc[i.sourceTeam] ??= []).push(i);
    return acc;
  }, {});

  if (!initiative) {
    return <p style={{ color: "var(--text-muted)" }}>Loading…</p>;
  }

  return (
    <div>
      {flow && <GreenfieldFlowBar flow={flow} />}

      <a href="/brd" style={{ color: "var(--text-muted)", fontSize: 13 }}>
        ← BRD
      </a>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
        BRD inputs: {initiative.name}
      </h1>
      {initiative.problemStatement && (
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          {initiative.problemStatement}
        </p>
      )}

      <div className="card" style={{ marginTop: 24, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>BRD Draft</h2>
          {brd?.content && !editingBrd && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={() => {
                  setDraftContent(brd.content ?? "");
                  setEditingBrd(true);
                }}
              >
                Edit
              </button>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={generateBrd} disabled={generating}>
                {generating ? "Regenerating…" : "Regenerate with AI"}
              </button>
            </div>
          )}
        </div>

        {brdError && <p style={{ color: "var(--danger)", fontSize: 12, marginBottom: 12 }}>{brdError}</p>}

        {!brd?.content && !editingBrd && (
          <div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
              No draft yet. Cortex will pull in completed strategy-gate experiments and any
              approved stakeholder input below.
            </p>
            <button className="btn-primary" onClick={generateBrd} disabled={generating}>
              {generating ? "Generating…" : "Generate BRD"}
            </button>
          </div>
        )}

        {brd?.content && !editingBrd && (
          <div
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            {brd.content}
          </div>
        )}

        {editingBrd && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea
              rows={20}
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-primary" onClick={saveBrd} disabled={savingBrd}>
                {savingBrd ? "Saving…" : "Save"}
              </button>
              <button className="btn-ghost" onClick={() => setEditingBrd(false)} disabled={savingBrd}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {flow &&
        (() => {
          const step = flow.steps.find((s) => s.key === "brd")!;
          const nextStep = flow.steps[flow.steps.findIndex((s) => s.key === "brd") + 1];
          return (
            <div style={{ marginBottom: 32 }}>
              <FlowStepFooter
                initiativeId={initiative.id}
                stepKey="brd"
                mandatory={step.mandatory}
                done={step.status === "done"}
                skipped={step.status === "skipped"}
                nextHref={nextStep.href}
                nextLabel={nextStep.label}
                onSkipped={() => {
                  refreshFlow();
                  window.location.href = nextStep.href;
                }}
              />
            </div>
          );
        })()}

      <div style={{ marginBottom: 32 }}>
        <BrdInputForm initiativeId={initiative.id} onCreated={handleCreated} />
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          Suggested {suggested.length > 0 && `(${suggested.length})`}
        </h2>
        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading…</p>
        ) : suggested.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Nothing waiting on review.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {suggested.map((input) => (
              <BrdInputCard key={input.id} input={input} onUpdated={handleUpdated} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Approved, by team</h2>
        {approved.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Nothing approved yet.</p>
        ) : (
          Object.entries(byTeam).map(([team, items]) => (
            <div key={team} style={{ marginBottom: 20 }}>
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}
              >
                {SOURCE_TEAM_LABEL[team as SourceTeam]}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {items.map((input) => (
                  <BrdInputCard key={input.id} input={input} onUpdated={handleUpdated} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
