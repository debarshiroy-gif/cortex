"use client";

import { useEffect, useState } from "react";

const PRODUCT_ID = "seed-product";

interface InitiativeRow {
  id: string;
  name: string;
}

export default function PrototypeHubPage() {
  const [initiatives, setInitiatives] = useState<InitiativeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/initiatives?productId=${PRODUCT_ID}`)
      .then((r) => r.json())
      .then(setInitiatives)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Prototype</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
        AI-generated UI mocks or backend specs, seeded from the BRD, Experiments, or a prompt
        you write yourself.
      </p>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : initiatives.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No initiatives yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {initiatives.map((init) => (
            <a key={init.id} href={`/prototype/${init.id}`} style={{ textDecoration: "none" }}>
              <div className="card" style={{ cursor: "pointer" }}>
                {init.name}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
