"use client";

import { useEffect, useState, use } from "react";
import { ModelChoiceSelect } from "@/components/ModelChoiceSelect";
import { useModelChoice } from "@/lib/useModelChoice";

const tierColors: Record<string, { bg: string; color: string }> = {
  major: { bg: "#fee2e2", color: "#991b1b" },
  minor: { bg: "#dbeafe", color: "#1e40af" },
  patch: { bg: "#f3f4f6", color: "#374151" },
};

interface FeatureRef {
  releaseId: string;
  featureId: string;
  feature: {
    id: string;
    name: string;
    status: string;
    kanoCategory: string | null;
    initiative: { name: string } | null;
    prd: { goals: string | null; acceptanceCriteria: string } | null;
  };
}

interface Release {
  id: string;
  name: string;
  tier: string;
  date: string | null;
  checklist: string | null;
  features: FeatureRef[];
}

interface Feature {
  id: string;
  name: string;
  status: string;
  initiative: { name: string } | null;
}

function parseChecklist(checklist: string): Array<{ raw: string; checked: boolean; isItem: boolean }> {
  return checklist.split("\n").map((line) => {
    const uncheckedMatch = /^(\s*)-\s\[ \]\s(.*)/.exec(line);
    const checkedMatch = /^(\s*)-\s\[x\]\s(.*)/i.exec(line);
    if (uncheckedMatch) {
      return { raw: line, checked: false, isItem: true };
    }
    if (checkedMatch) {
      return { raw: line, checked: true, isItem: true };
    }
    return { raw: line, checked: false, isItem: false };
  });
}

function toggleChecklistLine(checklist: string, lineIndex: number): string {
  const lines = checklist.split("\n");
  const line = lines[lineIndex];
  if (/^(\s*)-\s\[ \]\s/.test(line)) {
    lines[lineIndex] = line.replace(/^(\s*-\s)\[ \]/, "$1[x]");
  } else if (/^(\s*)-\s\[x\]\s/i.test(line)) {
    lines[lineIndex] = line.replace(/^(\s*-\s)\[x\]/i, "$1[ ]");
  }
  return lines.join("\n");
}

export default function ReleaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [release, setRelease] = useState<Release | null>(null);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState("");
  const [generatingChecklist, setGeneratingChecklist] = useState(false);
  const [addingFeature, setAddingFeature] = useState(false);
  const [modelChoice, setModelChoice] = useModelChoice();

  async function loadRelease() {
    const res = await fetch(`/api/releases/${id}`);
    setRelease(await res.json());
  }

  async function loadAllFeatures() {
    const res = await fetch(`/api/features?productId=seed-product`);
    setAllFeatures(await res.json());
  }

  useEffect(() => {
    loadRelease();
    loadAllFeatures();
  }, [id]);

  async function handleAddFeature() {
    if (!selectedFeatureId) return;
    setAddingFeature(true);
    await fetch(`/api/releases/${id}/features`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureId: selectedFeatureId }),
    });
    setSelectedFeatureId("");
    setAddingFeature(false);
    loadRelease();
  }

  async function handleRemoveFeature(featureId: string) {
    await fetch(`/api/releases/${id}/features`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureId }),
    });
    loadRelease();
  }

  async function handleGenerateChecklist() {
    setGeneratingChecklist(true);
    const res = await fetch(`/api/releases/${id}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelChoice }),
    });
    const data = await res.json();
    setRelease((prev) => prev ? { ...prev, checklist: data.checklist } : prev);
    setGeneratingChecklist(false);
  }

  async function handleToggleChecklistItem(lineIndex: number) {
    if (!release?.checklist) return;
    const newChecklist = toggleChecklistLine(release.checklist, lineIndex);
    setRelease((prev) => prev ? { ...prev, checklist: newChecklist } : prev);
    await fetch(`/api/releases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: newChecklist }),
    });
  }

  if (!release) {
    return <div style={{ color: "var(--text-muted)" }}>Loading…</div>;
  }

  const tc = tierColors[release.tier] ?? tierColors.patch;
  const linkedFeatureIds = new Set(release.features.map((rf) => rf.featureId));
  const availableFeatures = allFeatures.filter((f) => !linkedFeatureIds.has(f.id));
  const checklistLines = release.checklist ? parseChecklist(release.checklist) : [];

  return (
    <div>
      <a href="/releases" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
        ← Releases
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, marginBottom: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>{release.name}</h1>
        <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 10, background: tc.bg, color: tc.color }}>
          {release.tier}
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>
        {release.date ? new Date(release.date).toLocaleDateString() : "No date set"}
      </div>

      {/* Features section */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Features in this Release</h2>

        {release.features.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>No features linked yet.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {release.features.map((rf) => (
            <div key={rf.featureId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 6, background: "var(--background)", border: "1px solid var(--border)" }}>
              <div>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{rf.feature.name}</span>
                {rf.feature.initiative && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
                    {rf.feature.initiative.name}
                  </span>
                )}
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
                  [{rf.feature.status}]
                </span>
              </div>
              <button
                className="btn-secondary"
                style={{ fontSize: 12, padding: "3px 10px" }}
                onClick={() => handleRemoveFeature(rf.featureId)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {availableFeatures.length > 0 && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={selectedFeatureId}
              onChange={(e) => setSelectedFeatureId(e.target.value)}
              style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--background)", color: "inherit", fontSize: 13 }}
            >
              <option value="">Select a feature to add…</option>
              {availableFeatures.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}{f.initiative ? ` (${f.initiative.name})` : ""}
                </option>
              ))}
            </select>
            <button className="btn" onClick={handleAddFeature} disabled={!selectedFeatureId || addingFeature} style={{ fontSize: 13 }}>
              {addingFeature ? "Adding…" : "Add Feature"}
            </button>
          </div>
        )}
      </div>

      {/* Checklist section */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Launch Checklist</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ModelChoiceSelect value={modelChoice} onChange={setModelChoice} disabled={generatingChecklist} />
            <button className="btn" onClick={handleGenerateChecklist} disabled={generatingChecklist}>
              {generatingChecklist ? "Generating…" : release.checklist ? "Regenerate" : "Generate Checklist"}
            </button>
          </div>
        </div>

        {generatingChecklist && (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            AI is generating your {release.tier} launch checklist…
          </div>
        )}

        {!generatingChecklist && !release.checklist && (
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Click "Generate Checklist" to get a tier-scoped launch checklist based on your linked features.
          </div>
        )}

        {!generatingChecklist && release.checklist && (
          <div style={{ fontSize: 14, lineHeight: 1.7 }}>
            {checklistLines.map((line, i) => {
              if (line.isItem) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "3px 0" }}>
                    <input
                      type="checkbox"
                      checked={line.checked}
                      onChange={() => handleToggleChecklistItem(i)}
                      style={{ marginTop: 4, cursor: "pointer", accentColor: "var(--accent)" }}
                    />
                    <span style={{ textDecoration: line.checked ? "line-through" : "none", color: line.checked ? "var(--text-muted)" : "inherit" }}>
                      {line.raw.replace(/^\s*-\s\[[ x]\]\s*/i, "").replace(/^\s*-\s\[ \]\s*/, "")}
                    </span>
                  </div>
                );
              }
              if (line.raw.trim() === "") return <div key={i} style={{ height: 8 }} />;
              if (/^#{1,3}\s/.test(line.raw)) {
                return (
                  <div key={i} style={{ fontWeight: 600, marginTop: 16, marginBottom: 4, fontSize: line.raw.startsWith("# ") ? 16 : 14 }}>
                    {line.raw.replace(/^#{1,3}\s/, "")}
                  </div>
                );
              }
              return <div key={i} style={{ color: "var(--text-muted)" }}>{line.raw}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
