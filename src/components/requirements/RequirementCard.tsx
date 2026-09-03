"use client";

import { useState } from "react";
import type { GateStatus, Requirement } from "./types";
import { VerifyGatePanel } from "./VerifyGatePanel";
import { AuditTrailView } from "./AuditTrailView";

interface RequirementCardProps {
  requirement: Requirement;
  onUpdated: (requirement: Requirement) => void;
}

const GATE_ORDER: GateStatus[] = ["draft", "verify", "release"];

function parseList(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function RequirementCard({ requirement, onUpdated }: RequirementCardProps) {
  const [sourceDraft, setSourceDraft] = useState(requirement.sourceProvenance ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptanceCriteria = parseList(requirement.acceptanceCriteria);
  const edgeCases = parseList(requirement.edgeCases);
  const currentIndex = GATE_ORDER.indexOf(requirement.gateStatus);
  const isBlockedByProvenance =
    requirement.regime === "regulated" && !requirement.sourceProvenance?.trim();

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/requirements/${requirement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Update failed");
      return;
    }
    const updated = (await res.json()) as Requirement;
    onUpdated(updated);
  }

  function advanceGate() {
    const next = GATE_ORDER[currentIndex + 1];
    if (!next) return;
    if (isBlockedByProvenance) {
      setError(
        "Regulated requirements cannot advance past 'draft' without source_provenance."
      );
      return;
    }
    patch({ gateStatus: next });
  }

  function retreatGate() {
    const prev = GATE_ORDER[currentIndex - 1];
    if (!prev) return;
    patch({ gateStatus: prev });
  }

  function saveSource() {
    patch({ sourceProvenance: sourceDraft });
  }

  return (
    <div
      className="card"
      style={{ borderLeft: `3px solid ${requirement.regime === "regulated" ? "var(--warning)" : "var(--accent)"}` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <span className={`badge badge-${requirement.regime}`}>
              {requirement.regime === "regulated" ? "Regulated" : "Non-regulated"}
            </span>
            <span className={`badge badge-${requirement.gateStatus}`}>
              {requirement.gateStatus}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              drafted by {requirement.draftedBy}
            </span>
          </div>
          <p style={{ fontSize: 14, marginBottom: 8 }}>{requirement.requirementText}</p>

          {requirement.ownerName && (
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Owner: {requirement.ownerName}
            </p>
          )}

          {acceptanceCriteria.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                Acceptance criteria
              </div>
              <ul style={{ fontSize: 12, paddingLeft: 18 }}>
                {acceptanceCriteria.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {edgeCases.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                Edge cases
              </div>
              <ul style={{ fontSize: 12, paddingLeft: 18 }}>
                {edgeCases.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {requirement.riskIfWrong && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              Risk if wrong: {requirement.riskIfWrong}
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 12,
          background: "var(--surface-2)",
          borderRadius: "var(--radius)",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
          Source / provenance{" "}
          {requirement.regime === "regulated" && (
            <span style={{ color: "var(--warning)" }}>— required to leave draft</span>
          )}
        </div>
        {requirement.sourceExperimentId ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12 }}>🔗 {requirement.sourceProvenance}</span>
            <button
              className="btn-ghost"
              style={{ flexShrink: 0, fontSize: 12 }}
              onClick={() => patch({ sourceExperimentId: "" })}
              disabled={saving}
            >
              Unlink
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={sourceDraft}
              onChange={(e) => setSourceDraft(e.target.value)}
              placeholder="Regulation, policy, or precedent citation"
            />
            <button
              className="btn-ghost"
              style={{ flexShrink: 0 }}
              onClick={saveSource}
              disabled={saving || sourceDraft === (requirement.sourceProvenance ?? "")}
            >
              Save
            </button>
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          className="btn-ghost"
          style={{ fontSize: 12 }}
          onClick={retreatGate}
          disabled={saving || currentIndex <= 0}
        >
          ← Back to {GATE_ORDER[currentIndex - 1]}
        </button>
        {GATE_ORDER[currentIndex + 1] && GATE_ORDER[currentIndex + 1] !== "release" && (
          <button
            className="btn-ghost"
            style={{ fontSize: 12 }}
            onClick={advanceGate}
            disabled={saving}
            title={isBlockedByProvenance ? "Fill in source_provenance first" : undefined}
          >
            Advance to {GATE_ORDER[currentIndex + 1]} →
          </button>
        )}
      </div>

      {requirement.gateStatus === "verify" && (
        <VerifyGatePanel requirement={requirement} onUpdated={onUpdated} />
      )}

      <AuditTrailView requirementId={requirement.id} />
    </div>
  );
}
