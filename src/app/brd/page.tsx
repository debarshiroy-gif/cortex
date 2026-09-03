"use client";

import { useEffect, useState } from "react";
import type { BrdInput } from "@/components/brd/types";

const PRODUCT_ID = "seed-product";

interface InitiativeRow {
  id: string;
  name: string;
  strategyGateDecision: string;
}

interface InitiativeWithCounts extends InitiativeRow {
  suggestedCount: number;
  approvedCount: number;
}

export default function BrdHubPage() {
  const [initiatives, setInitiatives] = useState<InitiativeWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/initiatives?productId=${PRODUCT_ID}`)
      .then((r) => r.json())
      .then(async (list: InitiativeRow[]) => {
        const withCounts = await Promise.all(
          list.map(async (init) => {
            const inputs = (await fetch(`/api/brd-inputs?initiativeId=${init.id}`).then((r) =>
              r.json()
            )) as BrdInput[];
            return {
              ...init,
              suggestedCount: inputs.filter((i) => i.status === "suggested").length,
              approvedCount: inputs.filter((i) => i.status === "approved").length,
            };
          })
        );
        setInitiatives(withCounts);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>BRD</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
        Stakeholder input from functional teams, gated by the PM before it counts toward each
        initiative&apos;s BRD.
      </p>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : initiatives.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>No initiatives yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {initiatives.map((init) => (
            <a key={init.id} href={`/brd/${init.id}`} style={{ textDecoration: "none" }}>
              <div
                className="card"
                style={{
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{init.name}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {init.approvedCount} approved
                  {init.suggestedCount > 0 && ` · ${init.suggestedCount} suggested`} →
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
