"use client";

import { useState } from "react";
import type { Requirement } from "./types";
import { ModelChoiceSelect } from "@/components/ModelChoiceSelect";
import { useModelChoice } from "@/lib/useModelChoice";

interface VerifyGatePanelProps {
  requirement: Requirement;
  onUpdated: (requirement: Requirement) => void;
}

export function VerifyGatePanel({ requirement, onUpdated }: VerifyGatePanelProps) {
  const [checking, setChecking] = useState(false);
  const [issues, setIssues] = useState<string[] | null>(null);
  const [signOffBy, setSignOffBy] = useState(requirement.signOffBy ?? "");
  const [signOffDate, setSignOffDate] = useState(
    requirement.signOffDate ? requirement.signOffDate.slice(0, 10) : ""
  );
  const [signingOff, setSigningOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useModelChoice();

  async function runVerifyChecks() {
    setChecking(true);
    setError(null);
    const res = await fetch(`/api/requirements/${requirement.id}/verify-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelChoice }),
    });
    setChecking(false);
    if (!res.ok) {
      setError("Verify check failed to run");
      return;
    }
    const data = (await res.json()) as { issues: string[] };
    setIssues(data.issues);
  }

  async function signOffAndRelease() {
    if (!signOffBy.trim() || !signOffDate) {
      setError("A name and date are required to sign off");
      return;
    }
    setSigningOff(true);
    setError(null);
    const res = await fetch(`/api/requirements/${requirement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signOffApproved: true,
        signOffBy: signOffBy.trim(),
        signOffDate,
        gateStatus: "release",
      }),
    });
    setSigningOff(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Sign-off failed");
      return;
    }
    onUpdated((await res.json()) as Requirement);
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        background: "var(--surface-2)",
        borderRadius: "var(--radius)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Verify gate
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={checking} />
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={runVerifyChecks} disabled={checking}>
          {checking ? "Running…" : "Run verify checks"}
        </button>
      </div>

      {issues && (
        <div style={{ marginTop: 8 }}>
          {issues.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--success)" }}>
              No issues found — clear on traceability, consistency, and staleness.
            </p>
          ) : (
            <ul style={{ fontSize: 12, color: "var(--warning)", paddingLeft: 18 }}>
              {issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
            Signed off by
          </label>
          <input value={signOffBy} onChange={(e) => setSignOffBy(e.target.value)} placeholder="Full name" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
            Date
          </label>
          <input
            type="date"
            value={signOffDate}
            onChange={(e) => setSignOffDate(e.target.value)}
          />
        </div>
        <button
          className="btn-success"
          style={{ flexShrink: 0 }}
          onClick={signOffAndRelease}
          disabled={signingOff}
        >
          {signingOff ? "Signing off…" : "Sign off & release"}
        </button>
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
