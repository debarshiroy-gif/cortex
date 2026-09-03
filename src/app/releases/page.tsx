"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PRODUCT_ID = "seed-product";

const tierColors: Record<string, { bg: string; color: string }> = {
  major: { bg: "#fee2e2", color: "#991b1b" },
  minor: { bg: "#dbeafe", color: "#1e40af" },
  patch: { bg: "#f3f4f6", color: "#374151" },
};

interface Release {
  id: string;
  name: string;
  tier: string;
  date: string | null;
  features: unknown[];
}

export default function ReleasesPage() {
  const router = useRouter();
  const [releases, setReleases] = useState<Release[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [tier, setTier] = useState("minor");
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch(`/api/releases?productId=${PRODUCT_ID}`);
    const data = await res.json();
    setReleases(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    await fetch("/api/releases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: PRODUCT_ID, name, date: date || undefined, tier }),
    });
    setName("");
    setDate("");
    setTier("minor");
    setShowForm(false);
    setCreating(false);
    load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Releases</h1>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Release"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleCreate} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                Release Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="v2.4.0 — Search improvements"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--background)", color: "inherit", fontSize: 14 }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                Release Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--background)", color: "inherit", fontSize: 14 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--background)", color: "inherit", fontSize: 14 }}
              >
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="patch">Patch</option>
              </select>
            </div>
            <button className="btn" type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create Release"}
            </button>
          </form>
        </div>
      )}

      {releases.length === 0 && !showForm && (
        <div className="card" style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
          No releases yet. Create your first release to start tracking launches.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {releases.map((r) => {
          const tc = tierColors[r.tier] ?? tierColors.patch;
          return (
            <div
              key={r.id}
              className="card"
              onClick={() => router.push(`/releases/${r.id}`)}
              style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: tc.bg, color: tc.color }}>
                    {r.tier}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  {r.date ? new Date(r.date).toLocaleDateString() : "No date set"} · {r.features.length} feature{r.features.length !== 1 ? "s" : ""}
                </div>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: 18 }}>→</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
