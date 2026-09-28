import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText, type ModelChoice } from "@/lib/llm";
import { frameworks } from "@/lib/frameworks";
import { recordAuditEvent } from "@/lib/auditTrail";

const STALE_AFTER_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

interface ConsistencyCheck {
  consistent: boolean;
  issues: string[];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { model } = body as { model?: ModelChoice };

  const requirement = await prisma.requirement.findUnique({ where: { id } });
  if (!requirement) {
    return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
  }

  const issues: string[] = [];

  // Unverified: no source_provenance, or no human verification recorded yet.
  const isUnverified =
    !requirement.sourceProvenance?.trim() ||
    (!requirement.verifiedByName && !requirement.verifiedByDate);
  if (isUnverified) {
    issues.push("Unverified: missing source_provenance or no recorded verification");
  }

  // Stale: content changed since it was last verified, or verification never
  // happened, or it's older than the staleness window.
  const isStale =
    !requirement.verifiedByDate ||
    requirement.updatedAt > requirement.verifiedByDate ||
    Date.now() - requirement.verifiedByDate.getTime() > STALE_AFTER_MS;
  if (isStale) {
    issues.push(
      requirement.verifiedByDate
        ? "Stale: requirement changed or aged past the re-verification window since it was last verified"
        : "Stale: never verified"
    );
  }

  // Traceability: no path back to evidence at all.
  const missingTraceability =
    !requirement.linkedInsightId &&
    !requirement.linkedPrototypeArea &&
    !requirement.sourceProvenance?.trim();
  if (missingTraceability) {
    issues.push(
      "No traceability: no source_provenance, linked_insight_id, or linked_prototype_area"
    );
  }

  // Internal consistency: ask AI whether the acceptance criteria and edge
  // cases actually match the requirement text.
  const systemPrompt = frameworks.requirementGates();
  const userMessage = `
This is Verify-gate work: check this requirement for internal inconsistency.

requirement_text: "${requirement.requirementText}"
acceptance_criteria: ${requirement.acceptanceCriteria}
edge_cases: ${requirement.edgeCases}

Do the acceptance criteria and edge cases actually match and support the requirement
text, with no contradictions between them? Respond in this exact JSON format (no
markdown fences):
{
  "consistent": true or false,
  "issues": ["<specific contradiction or gap, if any>", ...]
}
`.trim();

  const raw = await streamText(systemPrompt, userMessage, undefined, model);
  try {
    const cleaned = raw.replace(/^```json\s*/m, "").replace(/\s*```$/m, "").trim();
    const parsed = JSON.parse(cleaned) as ConsistencyCheck;
    if (!parsed.consistent && parsed.issues?.length > 0) {
      issues.push(...parsed.issues.map((issue) => `Inconsistent: ${issue}`));
    }
  } catch {
    issues.push("Consistency check inconclusive: could not parse AI response");
  }

  if (issues.length > 0) {
    await recordAuditEvent({
      requirementId: id,
      actor: "ai",
      action: "flagged",
      note: issues.join("; "),
    });
  } else {
    await recordAuditEvent({
      requirementId: id,
      actor: "ai",
      action: "verified",
      note: "Verify-stage AI check: no issues found (traceability, consistency, staleness all clear)",
    });
  }

  return NextResponse.json({ issues });
}
