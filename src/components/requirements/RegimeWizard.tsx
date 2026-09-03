"use client";

import { useState } from "react";

export type Regime = "regulated" | "non_regulated";

interface WizardQuestion {
  id: string;
  prompt: string;
  regulatedLabel: string;
  nonRegulatedLabel: string;
}

const QUESTIONS: WizardQuestion[] = [
  {
    id: "law",
    prompt: "Does a law, regulation, or policy obligate this behavior?",
    regulatedLabel: "Yes",
    nonRegulatedLabel: "No",
  },
  {
    id: "audit",
    prompt: "Is an audit or traceability trail required for this requirement?",
    regulatedLabel: "Yes",
    nonRegulatedLabel: "No",
  },
  {
    id: "source",
    prompt: "Where does this requirement come from?",
    regulatedLabel: "Domain experts / regulation text",
    nonRegulatedLabel: "Observing users / usage data",
  },
  {
    id: "nature",
    prompt:
      "Is this a constraint (must be correct or incorrect) or a hypothesis (validated by behavior)?",
    regulatedLabel: "Constraint — correct or incorrect",
    nonRegulatedLabel: "Hypothesis — validated by behavior",
  },
  {
    id: "stakes",
    prompt: "Are there safety, financial, health, or privacy stakes if this is wrong?",
    regulatedLabel: "Yes",
    nonRegulatedLabel: "No",
  },
];

interface RegimeWizardProps {
  onComplete: (regime: Regime) => void;
  onCancel: () => void;
}

export function RegimeWizard({ onComplete, onCancel }: RegimeWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [override, setOverride] = useState<Regime | null>(null);

  const isDone = step >= QUESTIONS.length;
  const regulatedPoints = Object.values(answers).filter(Boolean).length;
  const suggested: Regime = regulatedPoints >= 2 ? "regulated" : "non_regulated";
  const selected = override ?? suggested;

  function answer(pointsToRegulated: boolean) {
    const question = QUESTIONS[step];
    setAnswers((prev) => ({ ...prev, [question.id]: pointsToRegulated }));
    setStep((prev) => prev + 1);
  }

  if (!isDone) {
    const question = QUESTIONS[step];
    return (
      <div className="card" style={{ borderColor: "var(--accent)" }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Regime Classifier — question {step + 1} of {QUESTIONS.length}
        </div>
        <p style={{ fontSize: 15, marginBottom: 16 }}>{question.prompt}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={() => answer(true)}>
            {question.regulatedLabel}
          </button>
          <button className="btn-ghost" onClick={() => answer(false)}>
            {question.nonRegulatedLabel}
          </button>
        </div>
        <button
          className="btn-ghost"
          style={{ marginTop: 16, fontSize: 12 }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ borderColor: "var(--accent)" }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Regime Classifier — result
      </div>
      <p style={{ fontSize: 14, marginBottom: 12 }}>
        {regulatedPoints} of {QUESTIONS.length} answers point toward{" "}
        <strong>regulated</strong>. Suggested regime:{" "}
        <span className={`badge badge-${suggested}`}>
          {suggested === "regulated" ? "Regulated" : "Non-regulated"}
        </span>
      </p>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input
            type="radio"
            name="regime-override"
            checked={selected === "regulated"}
            onChange={() => setOverride("regulated")}
            style={{ width: "auto" }}
          />
          Regulated
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input
            type="radio"
            name="regime-override"
            checked={selected === "non_regulated"}
            onChange={() => setOverride("non_regulated")}
            style={{ width: "auto" }}
          />
          Non-regulated
        </label>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-primary" onClick={() => onComplete(selected)}>
          Continue as {selected === "regulated" ? "Regulated" : "Non-regulated"}
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
