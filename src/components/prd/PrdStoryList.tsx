"use client";

import { useState } from "react";
import type { PrdStory } from "@/lib/prdStories";

interface PrdStoryListProps {
  prdId: string;
  initialStories: PrdStory[];
  onSaved: (stories: PrdStory[]) => void;
}

function emptyStory(): PrdStory {
  return { title: "", persona: "", description: "", acceptanceCriteria: [""] };
}

export function PrdStoryList({ prdId, initialStories, onSaved }: PrdStoryListProps) {
  const [stories, setStories] = useState<PrdStory[]>(initialStories);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function updateStory(index: number, patch: Partial<PrdStory>) {
    setStories((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function updateCriterion(index: number, critIndex: number, value: string) {
    setStories((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, acceptanceCriteria: s.acceptanceCriteria.map((c, ci) => (ci === critIndex ? value : c)) }
          : s
      )
    );
  }

  function addCriterion(index: number) {
    setStories((prev) =>
      prev.map((s, i) => (i === index ? { ...s, acceptanceCriteria: [...s.acceptanceCriteria, ""] } : s))
    );
  }

  function removeCriterion(index: number, critIndex: number) {
    setStories((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, acceptanceCriteria: s.acceptanceCriteria.filter((_, ci) => ci !== critIndex) }
          : s
      )
    );
  }

  function addStory() {
    setStories((prev) => [...prev, emptyStory()]);
    setEditingIndex(stories.length);
  }

  function removeStory(index: number) {
    setStories((prev) => prev.filter((_, i) => i !== index));
    setEditingIndex(null);
  }

  async function save() {
    setSaving(true);
    const survivingTitles = new Set(
      stories.map((s) => s.title.trim()).filter(Boolean)
    );
    const cleaned = stories
      .map((s) => {
        const title = s.title.trim();
        const linkedStoryTitles = (s.linkedStoryTitles ?? []).filter(
          (t) => t !== title && survivingTitles.has(t)
        );
        return {
          ...s,
          background: s.background?.trim() || undefined,
          linkedStoryTitles: linkedStoryTitles.length > 0 ? linkedStoryTitles : undefined,
          logic: s.logic?.trim() || undefined,
          mapping: s.mapping?.trim() || undefined,
          uiScreens: s.uiScreens?.trim() || undefined,
          acceptanceCriteria: s.acceptanceCriteria.map((c) => c.trim()).filter(Boolean),
        };
      })
      .filter((s) => s.title.trim());
    const res = await fetch(`/api/prd/${prdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stories: cleaned }),
    });
    setSaving(false);
    if (res.ok) {
      setStories(cleaned);
      setEditingIndex(null);
      onSaved(cleaned);
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600 }}>
          JIRA Story Breakdown {stories.length > 0 && `(${stories.length})`}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={addStory}>
            + Add story
          </button>
          <button className="btn-primary" style={{ fontSize: 12 }} onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {stories.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No stories yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {stories.map((story, i) => (
            <div
              key={i}
              style={{ padding: 12, background: "var(--surface-2)", borderRadius: "var(--radius)" }}
            >
              {editingIndex === i ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    placeholder="Story title"
                    value={story.title}
                    onChange={(e) => updateStory(i, { title: e.target.value })}
                  />
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                      On whose behalf (e.g. &quot;Operations Manager of Credit Saison&quot;)
                    </label>
                    <input
                      placeholder="Persona / role"
                      value={story.persona}
                      onChange={(e) => updateStory(i, { persona: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                      Background (optional) — context from the PRD (the future Epic)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. From Background and Context: ..."
                      value={story.background ?? ""}
                      onChange={(e) => updateStory(i, { background: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                      Linked stories (optional) — other stories in this PRD it depends on
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {stories
                        .map((s, si) => ({ title: s.title, si }))
                        .filter(({ si }) => si !== i)
                        .map(({ title, si }) => (
                          <label key={si} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                            <input
                              type="checkbox"
                              style={{ width: "auto" }}
                              checked={(story.linkedStoryTitles ?? []).includes(title)}
                              onChange={(e) => {
                                const current = story.linkedStoryTitles ?? [];
                                const next = e.target.checked
                                  ? [...current, title]
                                  : current.filter((t) => t !== title);
                                updateStory(i, { linkedStoryTitles: next.length > 0 ? next : undefined });
                              }}
                            />
                            {title || "(untitled story)"}
                          </label>
                        ))}
                      {stories.length <= 1 && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>No other stories yet.</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                      Description — start with &quot;As a &lt;persona&gt;, I want to…, so that…&quot;
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Description"
                      value={story.description}
                      onChange={(e) => updateStory(i, { description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                      Business / transformation logic (optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Business rules, validation, calculations involved…"
                      value={story.logic ?? ""}
                      onChange={(e) => updateStory(i, { logic: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                      Mapping document (optional) — which data/column goes where
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. source.customer_email -> CRM.contact.email"
                      value={story.mapping ?? ""}
                      onChange={(e) => updateStory(i, { mapping: e.target.value || undefined })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                      UI screens (optional) — which screen, and which part of it
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Checkout screen — the payment method selector"
                      value={story.uiScreens ?? ""}
                      onChange={(e) => updateStory(i, { uiScreens: e.target.value || undefined })}
                    />
                  </div>
                  <input
                    placeholder="Phase (optional)"
                    value={story.phase ?? ""}
                    onChange={(e) => updateStory(i, { phase: e.target.value || undefined })}
                  />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Acceptance Criteria</div>
                  {story.acceptanceCriteria.map((c, ci) => (
                    <div key={ci} style={{ display: "flex", gap: 6 }}>
                      <input
                        value={c}
                        onChange={(e) => updateCriterion(i, ci, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => removeCriterion(i, ci)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 11, alignSelf: "flex-start" }}
                    onClick={() => addCriterion(i)}
                  >
                    + Add criterion
                  </button>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => setEditingIndex(null)}>
                      Done
                    </button>
                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => removeStory(i)}>
                      Delete story
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {story.title || "(untitled story)"}
                        {story.phase && (
                          <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-muted)" }}>
                            {story.phase}
                          </span>
                        )}
                      </div>
                      {story.persona && (
                        <p style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>
                          As a {story.persona}…
                        </p>
                      )}
                      <p style={{ fontSize: 12, marginTop: 4 }}>{story.description}</p>
                    </div>
                    <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => setEditingIndex(i)}>
                      Edit
                    </button>
                  </div>

                  {story.background && (
                    <p style={{ fontSize: 12, marginTop: 8 }}>
                      <strong>Background:</strong> {story.background}
                    </p>
                  )}
                  {story.linkedStoryTitles && story.linkedStoryTitles.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 12 }}>Linked stories:</strong>
                      {story.linkedStoryTitles.map((t, ti) => (
                        <span
                          key={ti}
                          style={{
                            fontSize: 11,
                            padding: "1px 8px",
                            borderRadius: 99,
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {story.logic && (
                    <p style={{ fontSize: 12, marginTop: 8 }}>
                      <strong>Logic:</strong> {story.logic}
                    </p>
                  )}
                  {story.mapping && (
                    <p style={{ fontSize: 12, marginTop: 8, whiteSpace: "pre-wrap" }}>
                      <strong>Mapping:</strong> {story.mapping}
                    </p>
                  )}
                  {story.uiScreens && (
                    <p style={{ fontSize: 12, marginTop: 8 }}>
                      <strong>UI screens:</strong> {story.uiScreens}
                    </p>
                  )}

                  {story.acceptanceCriteria.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>Acceptance Criteria</div>
                      <ul style={{ fontSize: 12, marginTop: 4, paddingLeft: 18 }}>
                        {story.acceptanceCriteria.map((c, ci) => (
                          <li key={ci}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
