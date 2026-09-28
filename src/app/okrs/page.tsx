"use client";

import { useEffect, useId, useState } from "react";
import { ModelChoiceSelect } from "@/components/ModelChoiceSelect";
import { useModelChoice } from "@/lib/useModelChoice";

const PRODUCT_ID = "seed-product";

type KeyResult = {
  id: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  analysisFlag?: string | null;
  analysisSuggestion?: string | null;
};

type KRAnalysisResult = {
  krId: string;
  type: "outcome" | "output";
  flag: string | null;
  suggestion: string | null;
};

type OKR = {
  id: string;
  objective: string;
  quarter: string;
  keyResults: string;
  initiatives: { initiative: { id: string; name: string } }[];
};

function pct(kr: KeyResult) {
  if (!kr.target) return 0;
  return Math.min(100, Math.round((kr.current / kr.target) * 100));
}

function ProgressBar({ value }: { value: number }) {
  const color =
    value >= 80 ? "var(--success)" : value >= 50 ? "var(--warning)" : "var(--danger)";
  return (
    <div
      style={{
        height: 6,
        background: "var(--surface-2)",
        borderRadius: 99,
        overflow: "hidden",
        marginTop: 6,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: color,
          borderRadius: 99,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

function KRRow({
  kr,
  okrId,
  analysis,
  onProgressUpdate,
}: {
  kr: KeyResult;
  okrId: string;
  analysis: KRAnalysisResult | undefined;
  onProgressUpdate: (krId: string, val: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(kr.current));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/okrs/${okrId}/kr`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ krId: kr.id, current: Number(val) }),
    });
    onProgressUpdate(kr.id, Number(val));
    setEditing(false);
    setSaving(false);
  }

  const p = pct({ ...kr, current: Number(val) });
  const isOutput = analysis?.type === "output";

  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--surface-2)",
        borderRadius: "var(--radius)",
        borderLeft: isOutput ? "3px solid var(--warning)" : "3px solid transparent",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>{kr.description}</div>
          {isOutput && (
            <div
              style={{
                fontSize: 11,
                color: "var(--warning)",
                marginBottom: 4,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span>⚠️ {analysis.flag}</span>
              {analysis.suggestion && (
                <span style={{ color: "var(--text-muted)" }}>
                  💡 Suggested: <em>{analysis.suggestion}</em>
                </span>
              )}
            </div>
          )}
          <ProgressBar value={p} />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            {kr.current}{kr.unit} / {kr.target}{kr.unit} — {p}%
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          {editing ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="number"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                style={{ width: 80, padding: "4px 8px", fontSize: 12 }}
                autoFocus
              />
              <button
                className="btn-primary"
                style={{ padding: "4px 10px", fontSize: 12 }}
                onClick={save}
                disabled={saving}
              >
                {saving ? "…" : "Save"}
              </button>
              <button
                className="btn-ghost"
                style={{ padding: "4px 10px", fontSize: 12 }}
                onClick={() => setEditing(false)}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              className="btn-ghost"
              style={{ padding: "4px 10px", fontSize: 12 }}
              onClick={() => setEditing(true)}
            >
              Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OKRCard({ okr, onUpdated }: { okr: OKR; onUpdated: () => void }) {
  const [krs, setKrs] = useState<KeyResult[]>(JSON.parse(okr.keyResults));
  const [analysis, setAnalysis] = useState<KRAnalysisResult[]>([]);
  const [analysing, setAnalysing] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useModelChoice();

  async function analyse() {
    if (krs.length === 0) return;
    setAnalysing(true);
    const res = await fetch(`/api/okrs/${okr.id}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objective: okr.objective, keyResults: krs, model: modelChoice }),
    });
    const data = await res.json();
    setAnalysis(data.results ?? []);
    setAnalysisSummary(data.summary ?? null);
    setAnalysing(false);
  }

  function handleProgressUpdate(krId: string, current: number) {
    setKrs((prev) => prev.map((kr) => (kr.id === krId ? { ...kr, current } : kr)));
    onUpdated();
  }

  const overallPct =
    krs.length === 0
      ? 0
      : Math.round(krs.reduce((sum, kr) => sum + pct(kr), 0) / krs.length);

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {okr.quarter}
          </div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{okr.objective}</div>
          {okr.initiatives.length > 0 && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Supported by:{" "}
              {okr.initiatives.map((l) => l.initiative.name).join(", ")}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color:
                  overallPct >= 80
                    ? "var(--success)"
                    : overallPct >= 50
                    ? "var(--warning)"
                    : "var(--danger)",
              }}
            >
              {overallPct}%
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>overall</div>
          </div>
          {krs.length > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={analysing} />
              <button
                className="btn-ghost"
                style={{ fontSize: 12, padding: "4px 12px" }}
                onClick={analyse}
                disabled={analysing}
              >
                {analysing ? "Analysing…" : "Check KRs with AI"}
              </button>
            </div>
          )}
        </div>
      </div>

      {analysisSummary && (
        <div
          style={{
            padding: "10px 14px",
            background: "var(--surface-2)",
            borderRadius: "var(--radius)",
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 12,
          }}
        >
          {analysisSummary}
        </div>
      )}

      {krs.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No key results yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {krs.map((kr) => (
            <KRRow
              key={kr.id}
              kr={kr}
              okrId={okr.id}
              analysis={analysis.find((a) => a.krId === kr.id)}
              onProgressUpdate={handleProgressUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewOKRForm({ onCreated }: { onCreated: () => void }) {
  const uid = useId();
  const [objective, setObjective] = useState("");
  const [quarter, setQuarter] = useState("Q3 2026");
  const [krs, setKrs] = useState<KeyResult[]>([]);
  const [krDesc, setKrDesc] = useState("");
  const [krTarget, setKrTarget] = useState("");
  const [krUnit, setKrUnit] = useState("%");
  const [saving, setSaving] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<KRAnalysisResult[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useModelChoice();

  function addKR() {
    if (!krDesc.trim() || !krTarget) return;
    setKrs((prev) => [
      ...prev,
      {
        id: `${uid}-${Date.now()}`,
        description: krDesc.trim(),
        target: Number(krTarget),
        current: 0,
        unit: krUnit,
      },
    ]);
    setKrDesc("");
    setKrTarget("");
    setAnalysis([]);
    setAnalysisSummary(null);
  }

  function removeKR(id: string) {
    setKrs((prev) => prev.filter((k) => k.id !== id));
    setAnalysis((prev) => prev.filter((a) => a.krId !== id));
  }

  async function checkKRs() {
    if (!objective.trim() || krs.length === 0) return;
    setAnalysing(true);
    // Use a temp id for the analyze endpoint
    const res = await fetch(`/api/okrs/draft/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objective, keyResults: krs, model: modelChoice }),
    });
    const data = await res.json();
    setAnalysis(data.results ?? []);
    setAnalysisSummary(data.summary ?? null);
    setAnalysing(false);
  }

  async function create() {
    if (!objective.trim() || !quarter.trim()) return;
    setSaving(true);
    await fetch("/api/okrs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: PRODUCT_ID, objective, quarter, keyResults: krs }),
    });
    setObjective("");
    setKrs([]);
    setAnalysis([]);
    setAnalysisSummary(null);
    setSaving(false);
    onCreated();
  }

  const outputCount = analysis.filter((a) => a.type === "output").length;

  return (
    <div className="card" style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>New OKR</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          placeholder="Objective — inspiring, time-bound goal"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
        />
        <input
          placeholder="Quarter (e.g. Q3 2026)"
          value={quarter}
          onChange={(e) => setQuarter(e.target.value)}
          style={{ maxWidth: 200 }}
        />

        {/* KR builder */}
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: "var(--radius)",
            padding: 14,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            Key Results
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              placeholder="Measurable outcome (not a feature ship)"
              value={krDesc}
              onChange={(e) => setKrDesc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKR()}
            />
            <input
              type="number"
              placeholder="Target"
              value={krTarget}
              onChange={(e) => setKrTarget(e.target.value)}
              style={{ maxWidth: 90 }}
            />
            <input
              placeholder="Unit"
              value={krUnit}
              onChange={(e) => setKrUnit(e.target.value)}
              style={{ maxWidth: 70 }}
            />
            <button
              className="btn-ghost"
              onClick={addKR}
              style={{ flexShrink: 0 }}
            >
              Add KR
            </button>
          </div>

          {krs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {krs.map((kr) => {
                const a = analysis.find((x) => x.krId === kr.id);
                const isOutput = a?.type === "output";
                return (
                  <div
                    key={kr.id}
                    style={{
                      padding: "8px 12px",
                      background: "var(--surface)",
                      borderRadius: "var(--radius)",
                      borderLeft: isOutput
                        ? "3px solid var(--warning)"
                        : a
                        ? "3px solid var(--success)"
                        : "3px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13 }}>
                        {kr.description}{" "}
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                          (target: {kr.target}{kr.unit})
                        </span>
                      </span>
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: 14,
                          padding: 0,
                        }}
                        onClick={() => removeKR(kr.id)}
                      >
                        ✕
                      </button>
                    </div>
                    {isOutput && (
                      <div style={{ fontSize: 11, marginTop: 4 }}>
                        <span style={{ color: "var(--warning)" }}>⚠️ {a.flag}</span>
                        {a.suggestion && (
                          <div style={{ color: "var(--text-muted)", marginTop: 2 }}>
                            💡 <em>{a.suggestion}</em>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {analysisSummary && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "var(--surface)",
                borderRadius: "var(--radius)",
                fontSize: 12,
                color: outputCount > 0 ? "var(--warning)" : "var(--success)",
              }}
            >
              {analysisSummary}
            </div>
          )}

          {krs.length > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
              <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={analysing} />
              <button
                className="btn-ghost"
                style={{ fontSize: 12 }}
                onClick={checkKRs}
                disabled={analysing || !objective.trim()}
              >
                {analysing
                  ? "Checking…"
                  : `Check ${krs.length} KR${krs.length !== 1 ? "s" : ""} with AI`}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-primary"
            onClick={create}
            disabled={saving || !objective.trim()}
          >
            {saving ? "Saving…" : "Create OKR"}
          </button>
          {outputCount > 0 && (
            <span style={{ alignSelf: "center", fontSize: 12, color: "var(--warning)" }}>
              ⚠️ {outputCount} KR{outputCount !== 1 ? "s are" : " is"} output-framed — consider revising before saving
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OKRsPage() {
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`/api/okrs?productId=${PRODUCT_ID}`);
    const data = await res.json();
    setOkrs(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Group OKRs by quarter
  const byQuarter = okrs.reduce<Record<string, OKR[]>>((acc, okr) => {
    if (!acc[okr.quarter]) acc[okr.quarter] = [];
    acc[okr.quarter].push(okr);
    return acc;
  }, {});

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>OKRs</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 32, fontSize: 13 }}>
        AI checks your key results and flags outputs vs. measurable outcomes.
      </p>

      <NewOKRForm onCreated={load} />

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : okrs.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          No OKRs yet. Create one above.
        </p>
      ) : (
        Object.entries(byQuarter).map(([quarter, group]) => (
          <div key={quarter} style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 16,
              }}
            >
              {quarter}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {group.map((okr) => (
                <OKRCard key={okr.id} okr={okr} onUpdated={load} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
