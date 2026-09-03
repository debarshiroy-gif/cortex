"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ResearchGateBanner } from "@/components/research/ResearchGateBanner";
import { StrategyGateBanner } from "@/components/research/StrategyGateBanner";
import { BrdInputsBanner } from "@/components/brd/BrdInputsBanner";
import { useGreenfieldFlow } from "@/components/flow/useGreenfieldFlow";
import { GreenfieldFlowBar } from "@/components/flow/GreenfieldFlowBar";
import { FlowStepFooter } from "@/components/flow/FlowStepFooter";
import type {
  ResearchExperiment,
  ResearchGateStatus,
  StrategyGateDecision,
} from "@/components/research/types";

type Initiative = {
  id: string;
  name: string;
  status: string;
  problemStatement: string | null;
  hypothesis: string | null;
  riceReach: number | null;
  riceImpact: number | null;
  riceConfidence: number | null;
  riceEffort: number | null;
  riceScore: number | null;
  features: {
    id: string;
    name: string;
    status: string;
    regimeSummary: { regulatedCount: number; nonRegulatedCount: number; total: number; label: string };
  }[];
  notetakerFlag: boolean;
  researchGateStatus: ResearchGateStatus;
  researchSkipReason: string | null;
  strategyGateDecision: StrategyGateDecision;
  strategyGateNote: string | null;
  strategyGateDecidedBy: string | null;
  strategyGateDecidedAt: string | null;
  experiments: ResearchExperiment[];
  projectType: string;
  baselineInitiative: { id: string; name: string } | null;
};

type MeetingNoteSummary = {
  id: string;
  sourceType: string;
  status: string;
  meetingDate: string | null;
  geminiNotetakerEnabled: string | null;
};

type OKR = {
  id: string;
  objective: string;
  quarter: string;
};

const PRODUCT_ID = "seed-product";

export default function InitiativeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [rice, setRice] = useState({
    reach: "",
    impact: "1",
    confidence: "0.8",
    effort: "1",
  });
  const [riceResult, setRiceResult] = useState<{
    score: number;
    analysis: string;
  } | null>(null);
  const [scoring, setScoring] = useState(false);
  const [featureName, setFeatureName] = useState("");
  const [generatingPrd, setGeneratingPrd] = useState<string | null>(null);

  // OKR linking state
  const [linkedOkrs, setLinkedOkrs] = useState<OKR[]>([]);
  const [allOkrs, setAllOkrs] = useState<OKR[]>([]);
  const [selectedOkrId, setSelectedOkrId] = useState("");
  const [linkingOkr, setLinkingOkr] = useState(false);

  const [meetingNotes, setMeetingNotes] = useState<MeetingNoteSummary[]>([]);
  const { flow, refresh: refreshFlow } = useGreenfieldFlow(id);

  useEffect(() => {
    fetch(`/api/initiatives/${id}`)
      .then((r) => r.json())
      .then((found: Initiative) => setInitiative(found));

    fetch(`/api/initiatives/${id}/okr`)
      .then((r) => r.json())
      .then(setLinkedOkrs)
      .catch(() => []);

    fetch(`/api/okrs?productId=${PRODUCT_ID}`)
      .then((r) => r.json())
      .then(setAllOkrs)
      .catch(() => []);

    fetch(`/api/meeting-notes?linkedInitiativeId=${id}`)
      .then((r) => r.json())
      .then(setMeetingNotes)
      .catch(() => []);
  }, [id]);

  async function scoreRice() {
    setScoring(true);
    const res = await fetch(`/api/initiatives/${id}/rice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reach: Number(rice.reach),
        impact: Number(rice.impact),
        confidence: Number(rice.confidence),
        effort: Number(rice.effort),
      }),
    });
    const data = await res.json();
    setRiceResult({ score: data.score, analysis: data.analysis });
    setInitiative((prev) => prev && { ...prev, ...data.initiative });
    setScoring(false);
  }

  async function addFeature() {
    if (!featureName.trim()) return;
    const res = await fetch("/api/features", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initiativeId: id, name: featureName }),
    });
    const feature = await res.json();
    setInitiative(
      (prev) => prev && { ...prev, features: [...prev.features, feature] }
    );
    setFeatureName("");
  }

  async function generatePrd(featureId: string) {
    setGeneratingPrd(featureId);
    const res = await fetch("/api/prd/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureId }),
    });
    const data = await res.json();
    if (data.prd) {
      window.location.href = `/prd/${data.prd.id}`;
    }
    setGeneratingPrd(null);
  }

  async function linkOkr() {
    if (!selectedOkrId) return;
    setLinkingOkr(true);
    await fetch(`/api/initiatives/${id}/okr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ okrId: selectedOkrId }),
    });
    const okr = allOkrs.find((o) => o.id === selectedOkrId);
    if (okr && !linkedOkrs.find((o) => o.id === okr.id)) {
      setLinkedOkrs((prev) => [...prev, okr]);
    }
    setSelectedOkrId("");
    setLinkingOkr(false);
  }

  async function unlinkOkr(okrId: string) {
    await fetch(`/api/initiatives/${id}/okr?okrId=${okrId}`, {
      method: "DELETE",
    });
    setLinkedOkrs((prev) => prev.filter((o) => o.id !== okrId));
  }

  const unlinkableOkrs = allOkrs.filter(
    (o) => !linkedOkrs.find((l) => l.id === o.id)
  );

  if (!initiative) {
    return <p style={{ color: "var(--text-muted)" }}>Loading…</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <a href="/initiatives" style={{ color: "var(--text-muted)", fontSize: 13 }}>
          ← Initiatives
        </a>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
          {initiative.name}
        </h1>
        {initiative.problemStatement && (
          <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
            {initiative.problemStatement}
          </p>
        )}
        {initiative.notetakerFlag && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              background: "var(--surface-2)",
              border: "1px solid var(--warning)",
              borderRadius: "var(--radius)",
              fontSize: 13,
              color: "var(--warning)",
            }}
          >
            ⚠ This initiative has regulated Requirements, and at least one linked
            meeting had Gemini notetaker off or unanswered.
          </div>
        )}
        {initiative.baselineInitiative && (
          <p style={{ marginTop: 12, fontSize: 13 }}>
            Enhances:{" "}
            <a href={`/prd/initiative/${initiative.baselineInitiative.id}`}>
              {initiative.baselineInitiative.name} →
            </a>
          </p>
        )}
      </div>

      {flow && <GreenfieldFlowBar flow={flow} />}

      <ResearchGateBanner
        initiative={initiative}
        onUpdated={(patch) => {
          setInitiative((prev) => prev && { ...prev, ...patch });
          refreshFlow();
        }}
      />

      <StrategyGateBanner
        initiative={initiative}
        onUpdated={(patch) => {
          setInitiative((prev) => prev && { ...prev, ...patch });
          refreshFlow();
        }}
      />

      {flow && (() => {
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
              fetch(`/api/initiatives/${id}`)
                .then((r) => r.json())
                .then((found: Initiative) => setInitiative(found));
            }}
          />
        );
      })()}

      {initiative.strategyGateDecision === "proceed" && (
        <BrdInputsBanner initiativeId={initiative.id} />
      )}

      {initiative.strategyGateDecision === "proceed" && (
        <a href={`/prd/initiative/${initiative.id}`} style={{ textDecoration: "none" }}>
          <div
            className="card"
            style={{
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 15 }}>Product Requirements Document</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Generate / view PRD →
            </span>
          </div>
        </a>
      )}

      {/* RICE Scoring */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
          RICE Scoring
          {initiative.riceScore != null && (
            <span style={{ marginLeft: 12, color: "var(--accent)", fontSize: 20 }}>
              {initiative.riceScore.toFixed(1)}
            </span>
          )}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          {(
            [
              { key: "reach", label: "Reach (users/qtr)", placeholder: "500" },
              { key: "impact", label: "Impact (0.25–3)", placeholder: "1" },
              { key: "confidence", label: "Confidence (0–1)", placeholder: "0.8" },
              { key: "effort", label: "Effort (person-months)", placeholder: "1" },
            ] as const
          ).map(({ key, label, placeholder }) => (
            <div key={key}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                {label}
              </label>
              <input
                type="number"
                placeholder={placeholder}
                value={rice[key]}
                onChange={(e) =>
                  setRice((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={scoreRice} disabled={scoring}>
          {scoring ? "Scoring…" : "Calculate RICE Score"}
        </button>
        {riceResult && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: "var(--surface-2)",
              borderRadius: "var(--radius)",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Score: {riceResult.score.toFixed(1)}
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {riceResult.analysis}
            </p>
          </div>
        )}
      </div>

      {/* OKR alignment */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
          OKR Alignment
        </h2>

        {linkedOkrs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {linkedOkrs.map((okr) => (
              <div
                key={okr.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "var(--surface-2)",
                  borderRadius: "var(--radius)",
                  borderLeft: "3px solid var(--accent)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13 }}>{okr.objective}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {okr.quarter}
                  </div>
                </div>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: "4px 10px" }}
                  onClick={() => unlinkOkr(okr.id)}
                >
                  Unlink
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
            Not linked to any OKR yet.
          </p>
        )}

        {unlinkableOkrs.length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={selectedOkrId}
              onChange={(e) => setSelectedOkrId(e.target.value)}
            >
              <option value="">— Link to an OKR —</option>
              {unlinkableOkrs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.quarter}: {o.objective}
                </option>
              ))}
            </select>
            <button
              className="btn-ghost"
              onClick={linkOkr}
              disabled={!selectedOkrId || linkingOkr}
              style={{ flexShrink: 0 }}
            >
              {linkingOkr ? "Linking…" : "Link"}
            </button>
          </div>
        )}

        {allOkrs.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            No OKRs exist yet.{" "}
            <a href="/okrs">Create one on the OKRs page</a>.
          </p>
        )}
      </div>

      {/* Features */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Features</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            placeholder="Feature name"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFeature()}
          />
          <button
            className="btn-ghost"
            onClick={addFeature}
            style={{ flexShrink: 0 }}
          >
            Add
          </button>
        </div>
        {initiative.features.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No features yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {initiative.features.map((f) => (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "var(--surface-2)",
                  borderRadius: "var(--radius)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>{f.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "var(--surface)",
                      color:
                        f.regimeSummary.regulatedCount > 0
                          ? "var(--warning)"
                          : f.regimeSummary.total > 0
                          ? "var(--text-muted)"
                          : "var(--text-muted)",
                      border: `1px solid ${
                        f.regimeSummary.regulatedCount > 0 ? "var(--warning)" : "var(--border)"
                      }`,
                    }}
                    title="Regime mix of this feature's linked Requirements"
                  >
                    {f.regimeSummary.label}
                  </span>
                </div>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: "4px 12px" }}
                  onClick={() => generatePrd(f.id)}
                  disabled={generatingPrd === f.id}
                >
                  {generatingPrd === f.id ? "Generating…" : "Generate PRD →"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meeting Notes */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Meeting Notes</h2>
          <a href="/meeting-notes" style={{ fontSize: 12 }}>
            + Log a meeting note →
          </a>
        </div>
        {meetingNotes.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            No meeting notes linked to this initiative yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {meetingNotes.map((note) => (
              <div
                key={note.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "var(--surface-2)",
                  borderRadius: "var(--radius)",
                  fontSize: 13,
                }}
              >
                <span>
                  {note.sourceType}
                  {note.meetingDate ? ` · ${new Date(note.meetingDate).toLocaleDateString()}` : ""}
                </span>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`badge badge-${note.status === "approved" ? "approved" : note.status === "rejected" ? "killed" : "draft"}`}>
                    {note.status}
                  </span>
                  {(note.geminiNotetakerEnabled === "no" || !note.geminiNotetakerEnabled) && (
                    <span style={{ fontSize: 11, color: "var(--warning)" }}>notetaker off/blank</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
