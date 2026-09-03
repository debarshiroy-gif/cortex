"use client";

import { useEffect, useState } from "react";
import { InsightCard } from "@/components/insights/InsightCard";
import type { ResearchGateStatus } from "@/components/research/types";

const PRODUCT_ID = "seed-product";

type InitiativeResearchRow = {
  id: string;
  name: string;
  researchGateStatus: ResearchGateStatus;
};

const GATE_LABEL: Record<ResearchGateStatus, string> = {
  undecided: "Needs a research answer",
  needed: "Planning research",
  not_needed: "Research skipped",
};

type Persona = { id: string; name: string; description: string | null };

type JobStatement = {
  type: "functional" | "emotional" | "social";
  situation: string;
  motivation: string;
  outcome: string;
  statement: string;
  confidence: "high" | "med" | "low";
};

type Insight = {
  id: string;
  summary: string;
  tags: string;
  confidence: string;
};

type Interview = {
  id: string;
  notes: string | null;
  date: string;
  persona: { id: string; name: string };
  insights: Insight[];
};

const TYPE_COLOR: Record<string, string> = {
  functional: "#7c6af7",
  emotional: "#f472b6",
  social: "#34d399",
};

const CONF_LABEL: Record<string, string> = {
  high: "🟢 high",
  med: "🟡 med",
  low: "🔴 low",
};

export default function ResearchPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState("");
  const [newPersonaName, setNewPersonaName] = useState("");
  const [creatingPersona, setCreatingPersona] = useState(false);

  const [notes, setNotes] = useState("");
  const [savingInterview, setSavingInterview] = useState(false);

  const [currentInterviewId, setCurrentInterviewId] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<JobStatement[]>([]);
  const [saved, setSaved] = useState(false);

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [initiatives, setInitiatives] = useState<InitiativeResearchRow[]>([]);

  useEffect(() => {
    fetch(`/api/personas?productId=${PRODUCT_ID}`)
      .then((r) => r.json())
      .then((data: Persona[]) => {
        setPersonas(data);
        if (data.length > 0) setSelectedPersonaId(data[0].id);
      });

    fetch(`/api/interviews?productId=${PRODUCT_ID}`)
      .then((r) => r.json())
      .then(setInterviews);

    fetch(`/api/initiatives?productId=${PRODUCT_ID}`)
      .then((r) => r.json())
      .then(setInitiatives);
  }, []);

  async function createPersona() {
    if (!newPersonaName.trim()) return;
    setCreatingPersona(true);
    const res = await fetch("/api/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: PRODUCT_ID, name: newPersonaName }),
    });
    const p: Persona = await res.json();
    setPersonas((prev) => [...prev, p]);
    setSelectedPersonaId(p.id);
    setNewPersonaName("");
    setCreatingPersona(false);
  }

  async function saveAndExtract() {
    if (!selectedPersonaId || !notes.trim()) return;
    setSavingInterview(true);

    // 1. Save the interview
    const res = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personaId: selectedPersonaId, notes }),
    });
    const interview: Interview = await res.json();
    setCurrentInterviewId(interview.id);
    setSavingInterview(false);

    // 2. Extract JTBD insights via Claude
    setExtracting(true);
    setSaved(false);
    setExtracted([]);
    const extRes = await fetch(`/api/interviews/${interview.id}/extract`, {
      method: "POST",
    });
    const extData = await extRes.json();
    setExtracted(extData.jobStatements ?? []);
    setExtracting(false);
  }

  async function saveInsights() {
    if (!currentInterviewId || extracted.length === 0) return;

    const payload = extracted.map((js) => ({
      interviewId: currentInterviewId,
      summary: js.statement,
      tags: ["jtbd", js.type],
      confidence: js.confidence,
    }));

    await fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaved(true);
    setNotes("");
    setExtracted([]);

    // Refresh interview list
    const updated = await fetch(
      `/api/interviews?productId=${PRODUCT_ID}`
    ).then((r) => r.json());
    setInterviews(updated);
  }

  const byType = extracted.reduce<Record<string, JobStatement[]>>(
    (acc, js) => {
      if (!acc[js.type]) acc[js.type] = [];
      acc[js.type].push(js);
      return acc;
    },
    {}
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Research</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Paste interview notes → Claude extracts JTBD job statements → save
            as insights → build an{" "}
            <a href="/research/ost">Opportunity Solution Tree</a>.
          </p>
        </div>
        <a href="/research/ost">
          <button className="btn-ghost" style={{ fontSize: 13 }}>
            Opportunity Solution Tree →
          </button>
        </a>
      </div>

      {initiatives.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            Initiatives — research status
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {initiatives.map((init) => (
              <a
                key={init.id}
                href={`/research/plan/${init.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "var(--surface-2)",
                    borderRadius: "var(--radius)",
                    fontSize: 13,
                  }}
                >
                  <span>{init.name}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {GATE_LABEL[init.researchGateStatus]} →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        {/* Left: input panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Persona */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              Persona
            </h2>
            {personas.length > 0 ? (
              <select
                value={selectedPersonaId}
                onChange={(e) => setSelectedPersonaId(e.target.value)}
              >
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
                No personas yet.
              </p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                placeholder="New persona name…"
                value={newPersonaName}
                onChange={(e) => setNewPersonaName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createPersona()}
              />
              <button
                className="btn-ghost"
                onClick={createPersona}
                disabled={creatingPersona || !newPersonaName.trim()}
                style={{ flexShrink: 0 }}
              >
                {creatingPersona ? "…" : "Add"}
              </button>
            </div>
          </div>

          {/* Interview notes */}
          <div className="card">
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              Interview Notes
            </h2>
            <textarea
              rows={12}
              placeholder={`Paste raw interview notes here…\n\nExample:\n"I spend way too long copying numbers from our dashboards into slides every Monday. I always feel anxious presenting to the exec team because I'm never sure if the data is current. My manager keeps asking me why the numbers don't match what she sees in Salesforce…"`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ fontFamily: "inherit", resize: "vertical" }}
            />
            <button
              className="btn-primary"
              style={{ marginTop: 12, width: "100%" }}
              onClick={saveAndExtract}
              disabled={savingInterview || extracting || !notes.trim() || !selectedPersonaId}
            >
              {savingInterview
                ? "Saving…"
                : extracting
                ? "Claude is extracting JTBD insights…"
                : "Extract JTBD Insights with Claude"}
            </button>
          </div>
        </div>

        {/* Right: extraction results */}
        <div>
          {extracting && (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: "var(--text-muted)" }}>
                Reading notes and inferring underlying jobs…
              </p>
            </div>
          )}

          {extracted.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(["functional", "emotional", "social"] as const).map((type) => {
                const group = byType[type];
                if (!group?.length) return null;
                return (
                  <div key={type}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: TYPE_COLOR[type],
                        marginBottom: 8,
                      }}
                    >
                      {type}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {group.map((js, i) => (
                        <div
                          key={i}
                          className="card"
                          style={{
                            borderLeft: `3px solid ${TYPE_COLOR[type]}`,
                            padding: "12px 16px",
                          }}
                        >
                          <div style={{ fontSize: 13, marginBottom: 8, lineHeight: 1.6 }}>
                            <span style={{ color: "var(--text-muted)" }}>When </span>
                            {js.situation},{" "}
                            <span style={{ color: "var(--text-muted)" }}>I want to </span>
                            {js.motivation},{" "}
                            <span style={{ color: "var(--text-muted)" }}>so I can </span>
                            {js.outcome}.
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {CONF_LABEL[js.confidence]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {!saved ? (
                <button className="btn-primary" onClick={saveInsights}>
                  Save {extracted.length} Insights →
                </button>
              ) : (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "var(--surface-2)",
                    borderRadius: "var(--radius)",
                    color: "var(--success)",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  ✓ {extracted.length} insights saved.{" "}
                  <a href="/research/ost">Build an OST →</a>
                </div>
              )}
            </div>
          )}

          {extracted.length === 0 && !extracting && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {interviews.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  Extraction results will appear here.
                </p>
              ) : (
                <>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>
                    Past Interviews
                  </h2>
                  {interviews.map((iv) => (
                    <div key={iv.id} className="card" style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {iv.persona.name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            {new Date(iv.date).toLocaleDateString()} ·{" "}
                            {iv.insights.length} insight
                            {iv.insights.length !== 1 ? "s" : ""}
                          </div>
                          {iv.notes && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                marginTop: 6,
                                maxHeight: 40,
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {iv.notes}
                            </div>
                          )}
                        </div>
                        <div style={{ flexShrink: 0, display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 120, justifyContent: "flex-end" }}>
                          {iv.insights.slice(0, 3).map((ins) => {
                            const tags = JSON.parse(ins.tags) as string[];
                            const type = tags.find((t) =>
                              ["functional", "emotional", "social"].includes(t)
                            );
                            return (
                              <span
                                key={ins.id}
                                style={{
                                  fontSize: 10,
                                  padding: "2px 6px",
                                  borderRadius: 99,
                                  background: "var(--surface-2)",
                                  color: type ? TYPE_COLOR[type] : "var(--text-muted)",
                                  border: `1px solid ${type ? TYPE_COLOR[type] : "var(--border)"}`,
                                }}
                              >
                                {type ?? "insight"}
                              </span>
                            );
                          })}
                          {iv.insights.length > 3 && (
                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                              +{iv.insights.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {iv.insights.length > 0 && (
                        <div
                          style={{
                            marginTop: 10,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {iv.insights.map((ins) => (
                            <InsightCard
                              key={ins.id}
                              insightId={ins.id}
                              summary={ins.summary}
                              tags={JSON.parse(ins.tags) as string[]}
                              confidence={ins.confidence}
                              productId={PRODUCT_ID}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
