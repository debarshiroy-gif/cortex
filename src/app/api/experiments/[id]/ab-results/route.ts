import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({ where: { id } });
  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  const versionIds = JSON.parse(experiment.abTestVersionIds || "[]") as string[];
  const versions = await prisma.prototypeVersion.findMany({
    where: { id: { in: versionIds } },
    orderBy: { versionNumber: "asc" },
  });
  const feedback = await prisma.prototypeFeedback.findMany({ where: { experimentId: id } });

  const results = versions.map((v) => {
    const rows = feedback.filter((f) => f.shownVersionId === v.id);
    const ratings = rows.map((r) => r.rating).filter((r): r is number => r != null);
    const times = rows.map((r) => r.timeToCompleteMs).filter((t): t is number => t != null);
    const completedCount = rows.filter((r) => r.completed).length;

    return {
      versionId: v.id,
      versionNumber: v.versionNumber,
      readabilityScore: v.readabilityScore,
      responseCount: rows.length,
      averageRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      completionRate: rows.length ? completedCount / rows.length : null,
      averageTimeToCompleteMs: times.length ? times.reduce((a, b) => a + b, 0) / times.length : null,
      comments: rows.map((r) => r.comment).filter((c): c is string => !!c),
    };
  });

  return NextResponse.json({ results });
}
