"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InitiativeResearchSummary } from "./types";

interface ResearchGateBannerProps {
  initiative: InitiativeResearchSummary;
  onUpdated: (patch: Partial<InitiativeResearchSummary>) => void;
}

export function ResearchGateBanner({ initiative, onUpdated }: ResearchGateBannerProps) {
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function answer(researchGateStatus: "needed" | "not_needed", researchSkipReason?: string) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/initiatives/${initiative.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ researchGateStatus, researchSkipReason }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
      return;
    }
    onUpdated({ researchGateStatus, researchSkipReason: researchSkipReason ?? null });
    setShowPrompt(false);
    setSkipping(false);
  }

  async function startResearch() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/initiatives/${initiative.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ researchGateStatus: "needed" }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
      return;
    }
    onUpdated({ researchGateStatus: "needed", researchSkipReason: null });
    router.push(`/research/plan/${initiative.id}`);
  }

  const gateStatus = initiative.researchGateStatus;

  if (gateStatus === "needed" && !showPrompt) {
    const planned = initiative.experiments.filter((e) => e.status === "planned").length;
    const running = initiative.experiments.filter((e) => e.status === "running").length;
    const completed = initiative.experiments.filter((e) => e.status === "completed").length;
    return (
      <div
        className="card"
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Research plan: {planned} planned · {running} running · {completed} completed
        </div>
        <button
          className="btn-ghost"
          style={{ fontSize: 12 }}
          onClick={() => router.push(`/research/plan/${initiative.id}`)}
        >
          Open research plan →
        </button>
      </div>
    );
  }

  if (gateStatus === "not_needed" && !showPrompt) {
    return (
      <div
        className="card"
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Research skipped: {initiative.researchSkipReason}
        </div>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowPrompt(true)}>
          Actually, let&apos;s plan research
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 24, borderColor: "var(--accent)" }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Research check
      </div>
      <p style={{ fontSize: 15, marginBottom: 16 }}>Does this initiative need research?</p>

      {!skipping ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-primary"
            onClick={startResearch}
            disabled={saving}
          >
            {saving ? "Saving…" : "Yes, plan research →"}
          </button>
          <button className="btn-ghost" onClick={() => setSkipping(true)} disabled={saving}>
            No, skip
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            rows={2}
            placeholder="Why doesn't this need research right now?"
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-primary"
              onClick={() => answer("not_needed", skipReason)}
              disabled={saving || !skipReason.trim()}
            >
              {saving ? "Saving…" : "Confirm skip"}
            </button>
            <button className="btn-ghost" onClick={() => setSkipping(false)} disabled={saving}>
              Back
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
