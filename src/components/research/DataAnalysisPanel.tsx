"use client";

import { useRef, useState } from "react";
import type { ResearchExperiment } from "./types";

interface DataAnalysisPanelProps {
  experiment: ResearchExperiment;
  onUpdated: (experiment: ResearchExperiment) => void;
}

export function DataAnalysisPanel({ experiment, onUpdated }: DataAnalysisPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState(experiment.dataFileName ?? "");
  const [fileContent, setFileContent] = useState(experiment.dataFileContent ?? "");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFileName(file.name);
      setFileContent(String(reader.result ?? ""));
    };
    reader.readAsText(file);
  }

  async function analyze() {
    if (!fileContent) return;
    setAnalyzing(true);
    setError(null);
    const res = await fetch(`/api/experiments/${experiment.id}/analyze-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileContent }),
    });
    setAnalyzing(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to analyze data");
      return;
    }
    onUpdated((await res.json()) as ResearchExperiment);
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      {!experiment.result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} />
          {fileName && (
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Selected: {fileName}</p>
          )}
          <button
            className="btn-ghost"
            style={{ fontSize: 12, alignSelf: "flex-start" }}
            onClick={analyze}
            disabled={analyzing || !fileContent}
          >
            {analyzing ? "Analyzing…" : "Analyze with AI"}
          </button>
        </div>
      )}
      {error && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{error}</p>}
      {experiment.dataFileName && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
          Data source: {experiment.dataFileName}
        </p>
      )}
    </div>
  );
}
