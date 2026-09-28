import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText, type ModelChoice } from "@/lib/llm";
import { frameworks } from "@/lib/frameworks";

type Solution = {
  id: string;
  title: string;
  rationale: string;
  experiment: string;
};

type Opportunity = {
  id: string;
  label: string;
  insightIds: string[];
  solutions: Solution[];
};

type OSTResponse = {
  opportunities: Opportunity[];
};

export async function POST(request: Request) {
  const body = await request.json();
  const { outcome, productId, model } = body as {
    outcome: string;
    productId: string;
    model?: ModelChoice;
  };

  if (!outcome?.trim() || !productId) {
    return NextResponse.json(
      { error: "outcome and productId are required" },
      { status: 400 }
    );
  }

  // Load all insights for this product
  const insights = await prisma.insight.findMany({
    where: { interview: { persona: { productId } } },
    include: {
      interview: { include: { persona: { select: { name: true } } } },
    },
  });

  if (insights.length === 0) {
    return NextResponse.json(
      { error: "No insights found. Add interviews and extract insights first." },
      { status: 400 }
    );
  }

  const systemPrompt = frameworks.ost();

  const insightList = insights
    .map((ins) => {
      const tags = JSON.parse(ins.tags) as string[];
      return `[id:${ins.id}] (${tags.join(", ")}) "${ins.summary}" — persona: ${ins.interview.persona.name}, confidence: ${ins.confidence}`;
    })
    .join("\n");

  const userMessage = `
Target outcome: "${outcome}"

Available insights (${insights.length} total):
${insightList}

Build an opportunity solution tree:
1. Cluster the insights into 2-4 opportunities (user needs/pain points that, if addressed, would move the outcome).
2. For each opportunity, propose 2-3 candidate solutions.
3. For each opportunity, suggest one lightweight experiment to test the riskiest assumption.

Use the exact insight ids provided in the [id:...] prefix when referencing them.

Respond in this exact JSON format (no markdown fences):
{
  "opportunities": [
    {
      "id": "opp-1",
      "label": "<user need or pain point>",
      "insightIds": ["<insight-id>", ...],
      "solutions": [
        {
          "id": "sol-1",
          "title": "<solution title>",
          "rationale": "<one sentence why this addresses the opportunity>",
          "experiment": "<one lightweight test to validate the riskiest assumption>"
        }
      ]
    }
  ]
}
`.trim();

  const raw = await streamText(systemPrompt, userMessage, undefined, model);

  let parsed: OSTResponse;
  try {
    const cleaned = raw.replace(/^```json\s*/m, "").replace(/\s*```$/m, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response", raw },
      { status: 502 }
    );
  }

  // Attach full insight objects to each opportunity for the UI
  const insightMap = Object.fromEntries(insights.map((i) => [i.id, i]));
  const enriched = parsed.opportunities.map((opp) => ({
    ...opp,
    insights: opp.insightIds
      .map((iid) => insightMap[iid])
      .filter(Boolean)
      .map((ins) => ({
        id: ins.id,
        summary: ins.summary,
        tags: JSON.parse(ins.tags) as string[],
        confidence: ins.confidence,
        personaName: ins.interview.persona.name,
      })),
  }));

  return NextResponse.json({ outcome, opportunities: enriched });
}
