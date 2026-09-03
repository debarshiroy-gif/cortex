"use client";

import { useEffect, useState } from "react";

const PRODUCT_ID = "seed-product";

interface InitiativeRow {
  id: string;
  name: string;
  projectType: string;
}

interface InitiativeWithPrd extends InitiativeRow {
  prdStatus: string | null;
}

export default function PrdHubPage() {
  const [initiatives, setInitiatives] = useState<InitiativeWithPrd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/initiatives?productId=${PRODUCT_ID}`)
      .then((r) => r.json())
      .then(async (list: InitiativeRow[]) => {
        const withPrd = await Promise.all(
          list
            .filter((init) => init.projectType !== "external_baseline")
            .map(async (init) => {
              const prd = await fetch(`/api/prd?initiativeId=${init.id}`).then((r) => r.json());
              return { ...init, prdStatus: prd?.status ?? null };
            })
        );
        setInitiatives(withPrd);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>PRD</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
        The pipeline&apos;s final document — synthesized from the BRD, validation findings, and
        the prototype(s) built, with a JIRA-ready story breakdown.
      </p>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : initiatives.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No initiatives yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {initiatives.map((init) => (
            <a key={init.id} href={`/prd/initiative/${init.id}`} style={{ textDecoration: "none" }}>
              <div
                className="card"
                style={{
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {init.name}
                  {init.projectType === "brownfield" && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: "var(--surface)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      Brownfield
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {init.prdStatus ? `${init.prdStatus} →` : "not started →"}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
