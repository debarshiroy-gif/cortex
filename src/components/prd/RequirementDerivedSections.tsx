import type { Requirement } from "@/components/requirements/types";

interface RequirementDerivedSectionsProps {
  requirements: Requirement[];
}

function parseList(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function RequirementDerivedSections({
  requirements,
}: RequirementDerivedSectionsProps) {
  const withAcceptance = requirements.filter(
    (r) => parseList(r.acceptanceCriteria).length > 0
  );
  const withEdgeCases = requirements.filter(
    (r) => parseList(r.edgeCases).length > 0
  );

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>
        Pulled from this feature&apos;s linked Requirements — edit them in the
        Requirements section below, not here.
      </p>

      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
        Acceptance Criteria
      </h2>
      {withAcceptance.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
          No linked Requirements have acceptance criteria yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {withAcceptance.map((r) => (
            <div key={r.id}>
              <div
                style={{
                  fontSize: 12,
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span className={`badge badge-${r.regime}`}>
                  {r.regime === "regulated" ? "Regulated" : "Non-regulated"}
                </span>
                <span style={{ color: "var(--text-muted)" }}>{r.requirementText}</span>
              </div>
              <ul style={{ fontSize: 13, paddingLeft: 20 }}>
                {parseList(r.acceptanceCriteria).map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Edge Cases</h2>
      {withEdgeCases.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          No linked Requirements have edge cases yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {withEdgeCases.map((r) => (
            <div key={r.id}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                {r.requirementText}
              </div>
              <ul style={{ fontSize: 13, paddingLeft: 20 }}>
                {parseList(r.edgeCases).map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
