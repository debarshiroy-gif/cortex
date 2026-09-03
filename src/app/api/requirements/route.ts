import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/auditTrail";
import { formatExperimentCitation } from "@/lib/experimentCitation";

const REGIMES = ["regulated", "non_regulated"] as const;
const DRAFTED_BY = ["ai", "human"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const featureId = searchParams.get("featureId");

  if (!featureId) {
    return NextResponse.json(
      { error: "featureId is required" },
      { status: 400 }
    );
  }

  const requirements = await prisma.requirement.findMany({
    where: { featureId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(requirements);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    featureId,
    regime,
    requirementText,
    sourceProvenance,
    sourceExperimentId,
    ownerName,
    acceptanceCriteria,
    edgeCases,
    riskIfWrong,
    draftedBy,
    linkedInsightId,
    linkedPrototypeArea,
  } = body;

  if (!featureId || !requirementText?.trim()) {
    return NextResponse.json(
      { error: "featureId and requirementText are required" },
      { status: 400 }
    );
  }

  if (regime && !REGIMES.includes(regime)) {
    return NextResponse.json(
      { error: `regime must be one of: ${REGIMES.join(", ")}` },
      { status: 400 }
    );
  }

  if (draftedBy && !DRAFTED_BY.includes(draftedBy)) {
    return NextResponse.json(
      { error: `draftedBy must be one of: ${DRAFTED_BY.join(", ")}` },
      { status: 400 }
    );
  }

  // A linked Experiment is structured provenance: derive the citation text from
  // its method/sample size/effect size rather than trusting free-text input.
  let resolvedProvenance: string | null = sourceProvenance || null;
  if (sourceExperimentId) {
    const experiment = await prisma.experiment.findUnique({
      where: { id: sourceExperimentId },
    });
    if (!experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }
    resolvedProvenance = formatExperimentCitation(experiment);
  }

  const requirement = await prisma.requirement.create({
    data: {
      featureId,
      regime: regime ?? "non_regulated",
      requirementText: requirementText.trim(),
      sourceProvenance: resolvedProvenance,
      sourceExperimentId: sourceExperimentId || null,
      ownerName: ownerName || null,
      acceptanceCriteria: JSON.stringify(acceptanceCriteria ?? []),
      edgeCases: JSON.stringify(edgeCases ?? []),
      riskIfWrong: riskIfWrong || null,
      draftedBy: draftedBy ?? "human",
      linkedInsightId: linkedInsightId || null,
      linkedPrototypeArea: linkedPrototypeArea || null,
    },
  });

  await recordAuditEvent({
    requirementId: requirement.id,
    actor: requirement.draftedBy === "ai" ? "ai" : ownerName || "human",
    action: "drafted",
    note: `Created (${requirement.regime}, drafted by ${requirement.draftedBy})`,
  });

  return NextResponse.json(requirement, { status: 201 });
}
