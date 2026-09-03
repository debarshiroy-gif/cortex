"use client";

import { useEffect, useState } from "react";
import type { BrdInput } from "./types";

interface BrdInputsBannerProps {
  initiativeId: string;
}

export function BrdInputsBanner({ initiativeId }: BrdInputsBannerProps) {
  const [inputs, setInputs] = useState<BrdInput[] | null>(null);

  useEffect(() => {
    fetch(`/api/brd-inputs?initiativeId=${initiativeId}`)
      .then((r) => r.json())
      .then(setInputs)
      .catch(() => setInputs([]));
  }, [initiativeId]);

  if (!inputs) return null;

  const suggested = inputs.filter((i) => i.status === "suggested").length;
  const approved = inputs.filter((i) => i.status === "approved").length;

  return (
    <div
      className="card"
      style={{
        marginBottom: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
        BRD inputs: {approved} approved{suggested > 0 && ` · ${suggested} suggested`}
      </div>
      <a href={`/brd/${initiativeId}`}>
        <button className="btn-ghost" style={{ fontSize: 12 }}>
          Open BRD inputs →
        </button>
      </a>
    </div>
  );
}
