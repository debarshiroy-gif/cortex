"use client";

import { useEffect, useState } from "react";

const PRODUCT_ID = "seed-product";

interface Release {
  id: string;
  name: string;
  tier: string;
}

interface GeneratedDraft {
  tldr: string;
  wins: string[];
  risks: string[];
  asks: string[];
  summary: string;
}

interface StakeholderUpdate {
  id: string;
  period: string;
  summary: string | null;
  wins: string;
  risks: string;
  asks: string;
  createdAt: string;
  release: { name: string } | null;
}

export default function StakeholderUpdatesPage() {
  const [updates, setUpdates] = useState<StakeholderUpdate[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState("");
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadUpdates() {
    const res = await fetch("/api/stakeholder-updates");
    setUpdates(await res.json());
  }

  async function loadReleases() {
    const res = await fetch(`/api/releases?productId=${PRODUCT_ID}`);
    setReleases(await res.json());
  }

  useEffect(() => {
    loadUpdates();
    loadReleases();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!period.trim()) return;
    setGenerating(true);
    setDraft(null);
    try {
      const res = await fetch("/api/stakeholder-updates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, releaseId: selectedReleaseId || undefined }),
      });
      const data = await res.json();
      setDraft(data);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    await fetch("/api/stakeholder-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        period,
        summary: draft.tldr,
        wins: draft.wins,
        risks: draft.risks,
        asks: draft.asks,
        metricsSnapshot: {},
        releaseId: selectedReleaseId || undefined,
      }),
    });
    setDraft(null);
    setPeriod("");
    setSelectedReleaseId("");
    setShowForm(false);
    setSaving(false);
    loadUpdates();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Stakeholder Updates</h1>
        <button className="btn" onClick={() => { setShowForm(!showForm); setDraft(null); }}>
          {showForm ? "Cancel" : "Generate Update"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Generate with Claude</h2>
          <form onSubmit={handleGenerate} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                Period
              </label>
              <input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Q3 2025"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--background)", color: "inherit", fontSize: 14 }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                Linked Release (optional)
              </label>
              <select
                value={selectedReleaseId}
                onChange={(e) => setSelectedReleaseId(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--background)", color: "inherit", fontSize: 14 }}
              >
                <option value="">— none —</option>
                {releases.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <button className="btn" type="submit" disabled={generating}>
              {generating ? "Generating…" : "Generate with Claude"}
            </button>
          </form>

          {generating && (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Claude is pulling live OKR and release data…
            </div>
          )}

          {draft && (
            <div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>TL;DR</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, padding: "12px 14px", background: "var(--background)", borderRadius: 6, border: "1px solid var(--border)" }}>
                    {draft.tldr}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
                  {[
                    { label: "Wins", items: draft.wins, color: "#16a34a" },
                    { label: "Risks", items: draft.risks, color: "#dc2626" },
                    { label: "Asks", items: draft.asks, color: "#9333ea" },
                  ].map(({ label, items, color }) => (
                    <div key={label} style={{ padding: "12px 14px", background: "var(--background)", borderRadius: 6, border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color, marginBottom: 8 }}>{label}</div>
                      {items.length === 0 ? (
                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>None</div>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {items.map((item, i) => (
                            <li key={i} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Summary</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-muted)" }}>{draft.summary}</div>
                </div>

                <button className="btn" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Update"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {updates.length === 0 && !showForm && (
        <div className="card" style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
          No updates yet. Generate your first stakeholder update.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {updates.map((u) => {
          const wins = safeParseArray(u.wins);
          const risks = safeParseArray(u.risks);
          const asks = safeParseArray(u.asks);
          const isExpanded = expandedId === u.id;
          return (
            <div key={u.id} className="card">
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }}
                onClick={() => setExpandedId(isExpanded ? null : u.id)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                    {u.period}
                    {u.release && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
                        · {u.release.name}
                      </span>
                    )}
                  </div>
                  {u.summary && (
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                      {isExpanded ? u.summary : u.summary.slice(0, 120) + (u.summary.length > 120 ? "…" : "")}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                    {` · ${wins.length} win${wins.length !== 1 ? "s" : ""} · ${risks.length} risk${risks.length !== 1 ? "s" : ""}`}
                  </div>
                </div>
                <span style={{ color: "var(--text-muted)", marginLeft: 12 }}>{isExpanded ? "▲" : "▼"}</span>
              </div>

              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {[
                      { label: "Wins", items: wins, color: "#16a34a" },
                      { label: "Risks", items: risks, color: "#dc2626" },
                      { label: "Asks", items: asks, color: "#9333ea" },
                    ].map(({ label, items, color }) => (
                      <div key={label}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color, marginBottom: 6 }}>{label}</div>
                        {items.length === 0 ? (
                          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>None</div>
                        ) : (
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {items.map((item: string, i: number) => (
                              <li key={i} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 2 }}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function safeParseArray(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
