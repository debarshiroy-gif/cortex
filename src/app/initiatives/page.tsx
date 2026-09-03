"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Initiative = {
  id: string;
  name: string;
  status: string;
  riceScore: number | null;
  riceConfidence: number | null;
  problemStatement: string | null;
  notetakerFlag: boolean;
  projectType: string;
  baselineInitiativeId: string | null;
  prd: { status: string } | null;
};

const BASELINE_STATUSES = ["released", "baseline"];
const UPLOAD_SENTINEL = "__upload_prd__";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function InitiativesPage() {
  const router = useRouter();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [name, setName] = useState("");
  const [problem, setProblem] = useState("");
  const [projectType, setProjectType] = useState<"greenfield" | "regulated_greenfield" | "brownfield">(
    "greenfield"
  );
  const [baselineInitiativeId, setBaselineInitiativeId] = useState("");
  const [existingProjectName, setExistingProjectName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PRODUCT_ID = "seed-product"; // Replace with workspace/product selector

  useEffect(() => {
    fetch(`/api/initiatives?productId=${PRODUCT_ID}`)
      .then((r) => r.json())
      .then(setInitiatives);
  }, []);

  const isUploadingBaseline = projectType === "brownfield" && baselineInitiativeId === UPLOAD_SENTINEL;
  const trimmedProjectName = existingProjectName.trim();
  const nameCollision =
    trimmedProjectName.length > 0 &&
    initiatives.some((i) => i.name.trim().toLowerCase() === trimmedProjectName.toLowerCase());

  const canCreate =
    name.trim().length > 0 &&
    (projectType !== "brownfield"
      ? true
      : isUploadingBaseline
        ? trimmedProjectName.length > 0 && !nameCollision && !!uploadFile
        : baselineInitiativeId.length > 0);

  async function create() {
    if (!canCreate) return;
    setLoading(true);
    setError(null);

    if (isUploadingBaseline) {
      const fileBase64 = await readFileAsBase64(uploadFile!);
      const res = await fetch("/api/initiatives/with-baseline-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: PRODUCT_ID,
          name,
          problemStatement: problem || undefined,
          existingProjectName: trimmedProjectName,
          fileName: uploadFile!.name,
          fileBase64,
        }),
      });
      setLoading(false);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create initiative");
        return;
      }
      const created = await res.json();
      router.push(`/initiatives/${created.id}`);
      return;
    }

    const res = await fetch("/api/initiatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: PRODUCT_ID,
        name,
        problemStatement: problem,
        projectType,
        baselineInitiativeId: baselineInitiativeId || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create initiative");
      return;
    }
    const created = await res.json();
    router.push(`/initiatives/${created.id}`);
  }

  const baselineCandidates = initiatives.filter(
    (i) => i.prd && BASELINE_STATUSES.includes(i.prd.status)
  );

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        Initiatives
      </h1>

      <div className="card" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
          New Initiative
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            placeholder="Initiative name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            placeholder="Problem statement (optional)"
            value={problem}
            rows={3}
            onChange={(e) => setProblem(e.target.value)}
          />

          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              Project type
            </label>
            <select
              value={projectType}
              onChange={(e) => {
                setProjectType(e.target.value as "greenfield" | "regulated_greenfield" | "brownfield");
                setBaselineInitiativeId("");
                setExistingProjectName("");
                setUploadFile(null);
              }}
            >
              <option value="greenfield">Greenfield — new work</option>
              <option value="regulated_greenfield">
                Regulated Greenfield — new work, with Meeting Notes and BRD mandatory
              </option>
              <option value="brownfield">Brownfield — enhance an existing project</option>
            </select>
          </div>

          {projectType === "brownfield" && (
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                Which project does this enhance?
              </label>
              <select
                value={baselineInitiativeId}
                onChange={(e) => {
                  setBaselineInitiativeId(e.target.value);
                  setExistingProjectName("");
                  setUploadFile(null);
                }}
              >
                <option value="">— Choose a project —</option>
                {baselineCandidates.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
                <option value={UPLOAD_SENTINEL}>Upload PRD of existing Project</option>
              </select>
            </div>
          )}

          {isUploadingBaseline && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "var(--surface-2)", borderRadius: "var(--radius)" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                  Name of the existing project
                </label>
                <input
                  placeholder="e.g. Legacy Notification Service"
                  value={existingProjectName}
                  onChange={(e) => setExistingProjectName(e.target.value)}
                />
                {nameCollision && (
                  <p style={{ color: "var(--danger)", fontSize: 11, marginTop: 4 }}>
                    A project with this name already exists — choose a different name.
                  </p>
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                  Upload its existing PRD
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          )}

          {projectType !== "brownfield" && baselineCandidates.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                Enhances an existing baseline (optional)
              </label>
              <select
                value={baselineInitiativeId}
                onChange={(e) => setBaselineInitiativeId(e.target.value)}
              >
                <option value="">— None, this is standalone —</option>
                {baselineCandidates.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p>}

          <button className="btn-primary" onClick={create} disabled={loading || !canCreate}>
            {loading ? "Creating…" : "Create Initiative"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {initiatives.filter((init) => init.projectType !== "external_baseline").map((init) => (
          <a
            key={init.id}
            href={`/initiatives/${init.id}`}
            style={{ textDecoration: "none" }}
          >
            <div className="card" style={{ cursor: "pointer" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{init.name}</span>
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
                    {init.projectType === "regulated_greenfield" && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: "var(--surface)",
                          color: "var(--warning)",
                          border: "1px solid var(--warning)",
                        }}
                      >
                        Regulated
                      </span>
                    )}
                    {init.baselineInitiativeId && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: "var(--surface)",
                          color: "var(--accent)",
                          border: "1px solid var(--accent)",
                        }}
                      >
                        Enhancing
                      </span>
                    )}
                    {init.notetakerFlag && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: "var(--surface)",
                          color: "var(--warning)",
                          border: "1px solid var(--warning)",
                        }}
                        title="This initiative has regulated Requirements but a linked meeting had Gemini notetaker off or unanswered"
                      >
                        ⚠ Notetaker gap
                      </span>
                    )}
                  </div>
                  {init.problemStatement && (
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 13,
                        maxWidth: 600,
                      }}
                    >
                      {init.problemStatement}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <span className={`badge badge-${init.status}`}>
                    {init.status}
                  </span>
                  {init.riceScore != null && (
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 12,
                        alignSelf: "center",
                      }}
                    >
                      RICE: {init.riceScore.toFixed(1)}
                      {init.riceConfidence != null &&
                        init.riceConfidence < 0.5 &&
                        " ⚠️"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </a>
        ))}
        {initiatives.length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>
            No initiatives yet. Create one above.
          </p>
        )}
      </div>
    </div>
  );
}
