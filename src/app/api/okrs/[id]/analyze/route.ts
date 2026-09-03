import { NextResponse } from "next/server";
import { streamText } from "@/lib/anthropic";
import { frameworks } from "@/lib/frameworks";

type KeyResult = {
  id: string;
  description: string;
  target: number;
  current: number;
  unit: string;
};

type KRAnalysis = {
  krId: string;
  type: "outcome" | "output";
  flag: string | null;
  suggestion: string | null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // OKR id available if needed for DB write-back

  const body = await request.json();
  const { objective, keyResults } = body as {
    objective: string;
    keyResults: KeyResult[];
  };

  if (!objective || !Array.isArray(keyResults) || keyResults.length === 0) {
    return NextResponse.json(
      { error: "objective and keyResults are required" },
      { status: 400 }
    );
  }

  const systemPrompt = frameworks.okr();

  const userMessage = `
Objective: "${objective}"

Key Results:
${keyResults
  .map(
    (kr, i) =>
      `KR${i + 1} [id: ${kr.id}]: "${kr.description}" (target: ${kr.target}${kr.unit}, current: ${kr.current}${kr.unit})`
  )
  .join("\n")}

For each KR, determine:
1. Is it an "outcome" (a measurable change in user or business behavior) or an "output" (a shipped feature, task, or deliverable)?
2. If it's an output, explain why and suggest a rewrite as an outcome.

Respond in this exact JSON format (no markdown fences):
{
  "results": [
    {
      "krId": "<id>",
      "type": "outcome" | "output",
      "flag": "<one sentence explanation if output, null if outcome>",
      "suggestion": "<rewritten KR as an outcome if output, null if outcome>"
    }
  ],
  "summary": "<1-2 sentence overall assessment>"
}
`.trim();

  const raw = await streamText(systemPrompt, userMessage);

  let parsed: { results: KRAnalysis[]; summary: string };
  try {
    // Strip any accidental markdown fences Claude might add
    const cleaned = raw.replace(/^```json\s*/m, "").replace(/\s*```$/m, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse Claude response", raw },
      { status: 502 }
    );
  }

  return NextResponse.json(parsed);
}
