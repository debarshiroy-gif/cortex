import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_MODEL_CHOICE, llmErrorMessage, streamText, type ModelChoice } from "@/lib/llm";
import { frameworks } from "@/lib/frameworks";

type ExtractedJob = {
  type: "functional" | "emotional" | "social";
  situation: string;
  motivation: string;
  outcome: string;
  statement: string;
  confidence: "high" | "med" | "low";
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { model } = body as { model?: ModelChoice };

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { persona: { select: { name: true } } },
  });

  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  const systemPrompt = frameworks.jtbd();

  const userMessage = `
Persona: ${interview.persona.name}

Raw interview notes:
---
${interview.notes}
---

Extract 3–7 job statements from these notes in JTBD format (When / I want to / So I can).
Classify each as functional, emotional, or social. Don't restate feature requests — infer the underlying job.
Rate your confidence in each extraction: high, med, or low.

Respond in this exact JSON format (no markdown fences):
{
  "jobStatements": [
    {
      "type": "functional" | "emotional" | "social",
      "situation": "<when situation>",
      "motivation": "<I want to motivation>",
      "outcome": "<so I can outcome>",
      "statement": "When <situation>, I want to <motivation>, so I can <outcome>.",
      "confidence": "high" | "med" | "low"
    }
  ]
}
`.trim();

  const modelChoice = model ?? DEFAULT_MODEL_CHOICE;
  let raw: string;
  try {
    raw = await streamText(systemPrompt, userMessage, undefined, modelChoice);
  } catch (error) {
    console.error("JTBD extraction model request failed", error);
    return NextResponse.json(
      { error: llmErrorMessage(error, modelChoice) },
      { status: 502 }
    );
  }

  let parsed: { jobStatements: ExtractedJob[] };
  try {
    const cleaned = raw.replace(/^```json\s*/m, "").replace(/\s*```$/m, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response", raw },
      { status: 502 }
    );
  }

  return NextResponse.json({ jobStatements: parsed.jobStatements });
}
