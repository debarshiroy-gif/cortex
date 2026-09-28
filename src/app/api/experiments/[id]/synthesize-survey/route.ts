import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText, type ModelChoice } from "@/lib/llm";
import { frameworks } from "@/lib/frameworks";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { responses, model } = body as { responses?: string; model?: ModelChoice };

  if (!responses?.trim()) {
    return NextResponse.json({ error: "responses is required" }, { status: 400 });
  }

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: { initiative: { select: { name: true, hypothesis: true } } },
  });
  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (experiment.method !== "survey") {
    return NextResponse.json(
      { error: "This experiment's method is not survey" },
      { status: 400 }
    );
  }

  const userMessage = `
Initiative: ${experiment.initiative?.name ?? "unknown"}
Hypothesis: ${experiment.hypothesis ?? experiment.initiative?.hypothesis ?? "not provided"}
Success metric: ${experiment.successMetric ?? "not specified"}

Raw survey responses:
"""
${responses.trim()}
"""

Analyze this as instructed.
  `.trim();

  const result = await streamText(frameworks.surveySynthesis(), userMessage, undefined, model);

  const updated = await prisma.experiment.update({
    where: { id },
    data: {
      surveyResponses: responses.trim(),
      result,
      status: "completed",
    },
  });

  return NextResponse.json(updated);
}
