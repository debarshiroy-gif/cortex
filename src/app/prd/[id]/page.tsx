"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RequirementsPanel } from "@/components/requirements/RequirementsPanel";
import type { Requirement } from "@/components/requirements/types";
import { RequirementDerivedSections } from "@/components/prd/RequirementDerivedSections";
import { computeRegimeSummary } from "@/lib/regimeSummary";

type PRD = {
  id: string;
  featureId: string;
  problem: string | null;
  status: string;
  updatedAt: string;
  feature: {
    id: string;
    name: string;
    initiative: { name: string; product: { name: string } };
    requirements: Requirement[];
  };
};

export default function PrdPage() {
  const { id } = useParams<{ id: string }>();
  const [prd, setPrd] = useState<PRD | null>(null);

  useEffect(() => {
    // Fetch via features route and match
    fetch(`/api/prd/${id}`)
      .then((r) => r.json())
      .then(setPrd)
      .catch(() => null);
  }, [id]);

  if (!prd) {
    return <p style={{ color: "var(--text-muted)" }}>Loading PRD…</p>;
  }

  const regimeSummary = computeRegimeSummary(
    prd.feature.requirements.map((r) => r.regime)
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <a href="/initiatives" style={{ color: "var(--text-muted)", fontSize: 13 }}>
          ← Initiatives
        </a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 8 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>
              PRD: {prd.feature.name}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
              {prd.feature.initiative.product.name} /{" "}
              {prd.feature.initiative.name}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 99,
                background: "var(--surface)",
                color:
                  regimeSummary.regulatedCount > 0 ? "var(--warning)" : "var(--text-muted)",
                border: `1px solid ${
                  regimeSummary.regulatedCount > 0 ? "var(--warning)" : "var(--border)"
                }`,
              }}
            >
              {regimeSummary.label}
            </span>
            <span className={`badge badge-${prd.status}`}>{prd.status}</span>
            <a href={`/api/prd/${id}/export`}>
              <button className="btn-ghost" style={{ fontSize: 12 }}>
                Export .md
              </button>
            </a>
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          fontSize: 13,
          lineHeight: 1.7,
          color: "var(--text)",
          marginBottom: 24,
        }}
      >
        {prd.problem ?? "No content generated yet."}
      </div>

      <RequirementDerivedSections requirements={prd.feature.requirements} />

      <RequirementsPanel
        featureId={prd.feature.id}
        initialRequirements={prd.feature.requirements}
      />
    </div>
  );
}
