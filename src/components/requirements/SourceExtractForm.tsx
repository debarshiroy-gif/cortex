"use client";

import { useState } from "react";
import type { Regime } from "./RegimeWizard";
import type { Requirement } from "./types";
import { ModelChoiceSelect } from "@/components/ModelChoiceSelect";
import { useModelChoice } from "@/lib/useModelChoice";

interface SourceExtractFormProps {
  featureId: string;
  regime: Regime;
  onCreated: (requirements: Requirement[]) => void;
  onCancel: () => void;
}

export function SourceExtractForm({
  featureId,
  regime,
  onCreated,
  onCancel,
}: SourceExtractFormProps) {
  const [sourceText, setSourceText] = useState("");
  const [actorName, setActorName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useModelChoice();

  async function extract() {
    if (!sourceText.trim()) {
      setError("Paste the interview notes or source text first");
      return;
    }
    setExtracting(true);
    setError(null);
    const res = await fetch("/api/requirements/draft-from-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        featureId,
        regime,
        sourceText,
        actorName: actorName || undefined,
        model: modelChoice,
      }),
    });
    setExtracting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Extraction failed");
      return;
    }
    const data = (await res.json()) as { created: Requirement[] };
    onCreated(data.created);
  }

  return (
    <div className="card" style={{ borderColor: "var(--accent)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>Draft from source (AI)</h3>
        <span className={`badge badge-${regime}`}>
          {regime === "regulated" ? "Regulated" : "Non-regulated"}
        </span>
      </div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
        Paste expert interview notes or source/regulation text. AI will split it
        into atomic requirements, draft edge cases, and flag any acceptance criteria
        that would be vague or untestable.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <textarea
          rows={6}
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Paste expert interview notes or source text here…"
        />

        <div>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
            Your name (source owner)
          </label>
          <input value={actorName} onChange={(e) => setActorName(e.target.value)} />
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={extracting} />
          <button className="btn-primary" onClick={extract} disabled={extracting}>
            {extracting ? "Extracting…" : "Extract Requirements"}
          </button>
          <button className="btn-ghost" onClick={onCancel} disabled={extracting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
