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
  const { reach, impact, confidence, effort, model } = body as {
    reach?: number;
    impact?: number;
    confidence?: number;
    effort?: number;
    model?: ModelChoice;
  };

  if (
    reach == null ||
    impact == null ||
    confidence == null ||
    effort == null
  ) {
    return NextResponse.json(
      { error: "reach, impact, confidence, and effort are required" },
      { status: 400 }
    );
  }

  if (effort <= 0) {
    return NextResponse.json(
      { error: "effort must be greater than 0" },
      { status: 400 }
    );
  }

  const score = (reach * impact * confidence) / effort;

  const initiative = await prisma.initiative.update({
    where: { id },
    data: {
      riceReach: reach,
      riceImpact: impact,
      riceConfidence: confidence,
      riceEffort: effort,
      riceScore: score,
    },
  });

  // Compare against siblings for ranking context
  const siblings = await prisma.initiative.findMany({
    where: { productId: initiative.productId, riceScore: { not: null } },
    orderBy: { riceScore: "desc" },
    select: { id: true, name: true, riceScore: true, riceConfidence: true },
  });

  const systemPrompt = frameworks.rice();
  const userMessage = `
Here are the scored initiatives for this product, ranked by RICE score:
${siblings
  .map(
    (s, i) =>
      `${i + 1}. "${s.name}" — score: ${s.riceScore?.toFixed(1)}${
        s.riceConfidence != null && s.riceConfidence < 0.5
          ? " ⚠️ needs validation"
          : ""
      }`
  )
  .join("\n")}

The initiative just scored is "${initiative.name}" with:
- Reach: ${reach}
- Impact: ${impact}
- Confidence: ${confidence * 100}%
- Effort: ${effort} person-months
- RICE Score: ${score.toFixed(1)}

Provide a 2–3 sentence interpretation: where it ranks, whether confidence warrants validation first, and what the score implies for prioritization.
  `.trim();

  const analysis = await streamText(systemPrompt, userMessage, undefined, model);

  return NextResponse.json({ initiative, score, analysis });
}
