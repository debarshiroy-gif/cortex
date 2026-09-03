"use client";

import { useState } from "react";
import type { PrdStory } from "@/lib/prdStories";

interface PrdStoryListProps {
  prdId: string;
  initialStories: PrdStory[];
  onSaved: (stories: PrdStory[]) => void;
}

function emptyStory(): PrdStory {
  return { title: "", description: "", acceptanceCriteria: [""] };
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
    const cleaned = stories
      .map((s) => ({
        ...s,
        acceptanceCriteria: s.acceptanceCriteria.map((c) => c.trim()).filter(Boolean),
      }))
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
                  <textarea
                    rows={3}
                    placeholder="Description"
                    value={story.description}
                    onChange={(e) => updateStory(i, { description: e.target.value })}
                  />
                  <input
                    placeholder="Phase (optional)"
                    value={story.phase ?? ""}
                    onChange={(e) => updateStory(i, { phase: e.target.value || undefined })}
                  />
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Acceptance criteria</div>
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
                      <p style={{ fontSize: 12, marginTop: 4 }}>{story.description}</p>
                    </div>
                    <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => setEditingIndex(i)}>
                      Edit
                    </button>
                  </div>
                  {story.acceptanceCriteria.length > 0 && (
                    <ul style={{ fontSize: 12, marginTop: 8, paddingLeft: 18 }}>
                      {story.acceptanceCriteria.map((c, ci) => (
                        <li key={ci}>{c}</li>
                      ))}
                    </ul>
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
