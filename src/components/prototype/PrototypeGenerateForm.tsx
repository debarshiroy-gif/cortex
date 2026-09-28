"use client";

import { useState } from "react";
import type { PrototypeSourceMode, PrototypeVersion } from "./types";
import { ModelChoiceSelect } from "@/components/ModelChoiceSelect";
import { useModelChoice } from "@/lib/useModelChoice";

interface PrototypeGenerateFormProps {
  initiativeId: string;
  hasVersions: boolean;
  onCreated: (version: PrototypeVersion) => void;
}

export function PrototypeGenerateForm({
  initiativeId,
  hasVersions,
  onCreated,
}: PrototypeGenerateFormProps) {
  const [promptText, setPromptText] = useState("");
  const [generating, setGenerating] = useState<PrototypeSourceMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelChoice, setModelChoice] = useModelChoice();

  async function generate(sourceMode: PrototypeSourceMode) {
    if (sourceMode === "prompt" && !promptText.trim()) {
      setError("Type an instruction first");
      return;
    }
    setGenerating(sourceMode);
    setError(null);

    const res = await fetch("/api/prototype-versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initiativeId,
        sourceMode,
        promptText: promptText.trim() || undefined,
        model: modelChoice,
      }),
    });
    setGenerating(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to generate");
      return;
    }
    onCreated((await res.json()) as PrototypeVersion);
    setPromptText("");
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Generate a prototype</h2>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
        Cortex decides whether a UI mock or a backend spec fits what&apos;s being asked. Nothing
        generates until you choose an action below.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={generating !== null} />
        <button
          className="btn-ghost"
          style={{ fontSize: 12 }}
          onClick={() => generate("brd")}
          disabled={generating !== null}
        >
          {generating === "brd" ? "Generating…" : "From BRD"}
        </button>
        <button
          className="btn-ghost"
          style={{ fontSize: 12 }}
          onClick={() => generate("experiments")}
          disabled={generating !== null}
        >
          {generating === "experiments" ? "Generating…" : "From Experiments"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {hasVersions
            ? "Prompt — describe a change to apply to the latest version"
            : "Prompt — describe what to build (used alone, or as extra guidance for BRD/Experiments above)"}
        </label>
        <textarea
          rows={3}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder={
            hasVersions
              ? "e.g. Add a confirmation step before the destructive action"
              : "e.g. A settings screen where a PM can toggle which teams get notified"
          }
        />
        <button
          className="btn-primary"
          style={{ alignSelf: "flex-start" }}
          onClick={() => generate("prompt")}
          disabled={generating !== null}
        >
          {generating === "prompt" ? "Generating…" : hasVersions ? "Generate from prompt" : "Generate"}
        </button>
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
