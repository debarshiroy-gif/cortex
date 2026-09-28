import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText, type ModelChoice } from "@/lib/llm";
import { frameworks } from "@/lib/frameworks";
import { recordAuditEvent } from "@/lib/auditTrail";

const REGIMES = ["regulated", "non_regulated"] as const;

interface CandidateRequirement {
  requirementText: string;
  acceptanceCriteria: string[];
  edgeCases: string[];
  flags: string[];
}

interface DraftResponse {
  candidates: CandidateRequirement[];
}

export async function POST(request: Request) {
  const body = await request.json();
  const { featureId, regime, sourceText, actorName, model } = body as {
    featureId?: string;
    regime?: string;
    sourceText?: string;
    actorName?: string;
    model?: ModelChoice;
  };

  if (!featureId || !sourceText?.trim()) {
    return NextResponse.json(
      { error: "featureId and sourceText are required" },
      { status: 400 }
    );
  }

  if (regime && !REGIMES.includes(regime as (typeof REGIMES)[number])) {
    return NextResponse.json(
      { error: `regime must be one of: ${REGIMES.join(", ")}` },
      { status: 400 }
    );
  }

  const feature = await prisma.feature.findUnique({ where: { id: featureId } });
  if (!feature) {
    return NextResponse.json({ error: "Feature not found" }, { status: 404 });
  }

  const resolvedRegime = regime ?? "non_regulated";
  const systemPrompt = frameworks.requirementGates();

  const userMessage = `
This is Draft-gate work: turn the source text below into candidate atomic requirements.

Regime for these requirements: ${resolvedRegime}

Source text (expert interview notes, regulation text, or policy document):
"""
${sourceText.trim()}
"""

For each atomic requirement you find:
1. Write one testable requirement_text (split compound requirements into separate rows).
2. Generate 2-4 realistic edge_cases.
3. Generate 1-3 acceptance_criteria written as "Given X, when Y, then Z" test cases.
4. Flag any acceptance criteria you wrote (or that the source implies) that would be
   vague or untestable — list the specific wording problem in "flags". If everything is
   testable, return an empty flags array.

Respond in this exact JSON format (no markdown fences):
{
  "candidates": [
    {
      "requirementText": "<one atomic, testable requirement>",
      "acceptanceCriteria": ["Given ... when ... then ...", ...],
      "edgeCases": ["<edge case>", ...],
      "flags": ["<vague/untestable criterion and why>", ...]
    }
  ]
}
`.trim();

  const raw = await streamText(systemPrompt, userMessage, undefined, model);

  let parsed: DraftResponse;
  try {
    const cleaned = raw.replace(/^```json\s*/m, "").replace(/\s*```$/m, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response", raw },
      { status: 502 }
    );
  }

  const created = [];
  for (const candidate of parsed.candidates) {
    if (!candidate.requirementText?.trim()) continue;

    const requirement = await prisma.requirement.create({
      data: {
        featureId,
        regime: resolvedRegime,
        requirementText: candidate.requirementText.trim(),
        acceptanceCriteria: JSON.stringify(candidate.acceptanceCriteria ?? []),
        edgeCases: JSON.stringify(candidate.edgeCases ?? []),
        draftedBy: "ai",
        ownerName: actorName?.trim() || null,
      },
    });

    await recordAuditEvent({
      requirementId: requirement.id,
      actor: "ai",
      action: "drafted",
      note: actorName?.trim()
        ? `Drafted from source text supplied by ${actorName.trim()}`
        : "Drafted from source text via AI extraction",
    });

    if (candidate.flags?.length > 0) {
      await recordAuditEvent({
        requirementId: requirement.id,
        actor: "ai",
        action: "flagged",
        note: `Vague/untestable acceptance criteria: ${candidate.flags.join("; ")}`,
      });
    }

    created.push(requirement);
  }

  return NextResponse.json({ created }, { status: 201 });
}
