import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText } from "@/lib/anthropic";
import { frameworks } from "@/lib/frameworks";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({ where: { id } });
  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (experiment.method !== "ab_test") {
    return NextResponse.json(
      { error: "This experiment's method is not ab_test" },
      { status: 400 }
    );
  }

  const versionIds = JSON.parse(experiment.abTestVersionIds || "[]") as string[];
  const versions = await prisma.prototypeVersion.findMany({
    where: { id: { in: versionIds } },
    orderBy: { versionNumber: "asc" },
  });
  const feedback = await prisma.prototypeFeedback.findMany({ where: { experimentId: id } });

  if (feedback.length === 0) {
    return NextResponse.json({ error: "No feedback recorded yet" }, { status: 400 });
  }

  const perVersion = versions.map((v) => {
    const rows = feedback.filter((f) => f.shownVersionId === v.id);
    const ratings = rows.map((r) => r.rating).filter((r): r is number => r != null);
    const times = rows.map((r) => r.timeToCompleteMs).filter((t): t is number => t != null);
    const completedCount = rows.filter((r) => r.completed).length;
    const comments = rows.map((r) => r.comment).filter((c): c is string => !!c);

    return `Version ${v.versionNumber} (readability: ${v.readabilityScore ?? "n/a"}):
- Responses: ${rows.length}
- Average rating: ${ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : "n/a"}
- Completion rate: ${rows.length ? `${Math.round((completedCount / rows.length) * 100)}%` : "n/a"}
- Average time to complete: ${times.length ? `${Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms` : "n/a"}
- Comments: ${comments.length ? comments.map((c) => `"${c}"`).join("; ") : "none"}`;
  });

  const userMessage = `Hypothesis being tested: ${experiment.hypothesis ?? "not specified"}

${perVersion.join("\n\n")}`;

  const text = await streamText(frameworks.abTestSynthesis(), userMessage, 4096);

  const updated = await prisma.experiment.update({
    where: { id },
    data: { result: text, status: "completed" },
  });

  return NextResponse.json(updated);
}
