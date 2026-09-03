import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AB_TEST_MIN_VERSIONS, VALIDATION_METHODS } from "@/components/research/methodLabels";

const METHODS = [
  "survey",
  "jtbd_interview",
  "ai_moderated_interview",
  "usability_test",
  "live_experiment",
  "usage_analytics",
  "session_replay",
  "support_data",
  "qual_corpus",
  "market_research",
  "data_analysis",
  "secondary_research",
  "fake_door_test",
  "ab_test",
] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const insightId = searchParams.get("insightId");
  const initiativeId = searchParams.get("initiativeId");

  if (!insightId && !initiativeId) {
    return NextResponse.json(
      { error: "insightId or initiativeId is required" },
      { status: 400 }
    );
  }

  const experiments = await prisma.experiment.findMany({
    where: { ...(insightId ? { insightId } : {}), ...(initiativeId ? { initiativeId } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(experiments);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    insightId,
    initiativeId,
    method,
    hypothesis,
    successMetric,
    sampleSize,
    effectSize,
    result,
    watchOut,
    status,
  } = body;

  if ((!insightId && !initiativeId) || !method) {
    return NextResponse.json(
      { error: "insightId or initiativeId, and method, are required" },
      { status: 400 }
    );
  }

  if (!METHODS.includes(method)) {
    return NextResponse.json(
      { error: `method must be one of: ${METHODS.join(", ")}` },
      { status: 400 }
    );
  }

  if (insightId) {
    const insight = await prisma.insight.findUnique({ where: { id: insightId } });
    if (!insight) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }
  }

  if (initiativeId) {
    const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
    if (!initiative) {
      return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
    }

    if ((VALIDATION_METHODS as readonly string[]).includes(method)) {
      const prototypeCount = await prisma.prototypeVersion.count({ where: { initiativeId } });
      if (prototypeCount === 0) {
        return NextResponse.json(
          { error: "Validation experiments require a prototype first" },
          { status: 400 }
        );
      }
      if (method === "ab_test" && prototypeCount < AB_TEST_MIN_VERSIONS) {
        return NextResponse.json(
          { error: `A/B testing requires at least ${AB_TEST_MIN_VERSIONS} prototype versions to compare` },
          { status: 400 }
        );
      }
    }
  }

  const [experiment] = await prisma.$transaction([
    prisma.experiment.create({
      data: {
        insightId: insightId || null,
        initiativeId: initiativeId || null,
        method,
        hypothesis: hypothesis || null,
        successMetric: successMetric || null,
        sampleSize: sampleSize != null ? Number(sampleSize) : null,
        effectSize: effectSize != null ? Number(effectSize) : null,
        result: result || null,
        watchOut: watchOut || null,
        status: status || (result ? "completed" : "planned"),
      },
    }),
    ...(initiativeId
      ? [
          prisma.initiative.updateMany({
            where: { id: initiativeId, researchGateStatus: "undecided" },
            data: { researchGateStatus: "needed" },
          }),
        ]
      : []),
  ]);

  return NextResponse.json(experiment, { status: 201 });
}
