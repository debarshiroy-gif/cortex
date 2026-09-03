import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/auditTrail";
import { formatExperimentCitation } from "@/lib/experimentCitation";

const REGIMES = ["regulated", "non_regulated"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { featureId, regime, experimentId, actorName } = body as {
    featureId?: string;
    regime?: string;
    experimentId?: string;
    actorName?: string;
  };

  if (!featureId) {
    return NextResponse.json({ error: "featureId is required" }, { status: 400 });
  }

  if (regime && !REGIMES.includes(regime as (typeof REGIMES)[number])) {
    return NextResponse.json(
      { error: `regime must be one of: ${REGIMES.join(", ")}` },
      { status: 400 }
    );
  }

  const insight = await prisma.insight.findUnique({ where: { id } });
  if (!insight) {
    return NextResponse.json({ error: "Insight not found" }, { status: 404 });
  }

  const feature = await prisma.feature.findUnique({ where: { id: featureId } });
  if (!feature) {
    return NextResponse.json({ error: "Feature not found" }, { status: 404 });
  }

  // Pull in the linked Experiment's method, sample size, and effect size as the
  // requirement's provenance instead of a loose citation — the worked example
  // from the BRD (funnel analysis → usability test → PRD row → prototype → validated).
  const experiment = experimentId
    ? await prisma.experiment.findUnique({ where: { id: experimentId } })
    : await prisma.experiment.findFirst({
        where: { insightId: id },
        orderBy: { createdAt: "desc" },
      });

  if (experimentId && !experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (experiment && experiment.insightId !== id) {
    return NextResponse.json(
      { error: "Experiment does not belong to this insight" },
      { status: 400 }
    );
  }

  const resolvedRegime = regime ?? "non_regulated";

  const requirement = await prisma.requirement.create({
    data: {
      featureId,
      regime: resolvedRegime,
      requirementText: insight.summary,
      sourceProvenance: experiment ? formatExperimentCitation(experiment) : null,
      sourceExperimentId: experiment?.id ?? null,
      ownerName: actorName || null,
      linkedInsightId: insight.id,
      draftedBy: "ai",
    },
  });

  await recordAuditEvent({
    requirementId: requirement.id,
    actor: actorName || "ai",
    action: "drafted",
    note: experiment
      ? `Promoted from insight ${insight.id}, provenance from Experiment ${experiment.id} (${experiment.method})`
      : `Promoted from insight ${insight.id} (no linked Experiment)`,
  });

  if (resolvedRegime === "regulated" && !experiment) {
    await recordAuditEvent({
      requirementId: requirement.id,
      actor: "ai",
      action: "flagged",
      note: "Promoted into the regulated track with no source Experiment — flag for expert review before leaving draft.",
    });
  }

  return NextResponse.json(requirement, { status: 201 });
}
