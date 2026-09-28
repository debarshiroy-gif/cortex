import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamResearch, streamChat, type ModelChoice } from "@/lib/llm";
import { frameworks } from "@/lib/frameworks";
import { splitSecondaryResearch } from "@/lib/secondaryResearchReport";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { model, correction } = body as { model?: ModelChoice; correction?: string };

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: { initiative: { select: { name: true, problemStatement: true, hypothesis: true } } },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (experiment.method !== "secondary_research") {
    return NextResponse.json(
      { error: "This experiment's method is not secondary_research" },
      { status: 400 }
    );
  }
  if (correction?.trim() && !experiment.result) {
    return NextResponse.json(
      { error: "There's no prior research to correct yet — run it once first." },
      { status: 400 }
    );
  }

  const systemPrompt = frameworks.secondaryResearch();
  const userMessage = `
Initiative: ${experiment.initiative?.name ?? "unknown"}
Problem statement: ${experiment.initiative?.problemStatement ?? "not provided"}
Hypothesis being checked: ${experiment.hypothesis ?? experiment.initiative?.hypothesis ?? "not provided"}
Success metric to keep in mind: ${experiment.successMetric ?? "not specified"}

Research this and report Key Findings then Extended Report as instructed.${
    correction?.trim()
      ? `

Prior Key Findings:
${experiment.result}

PM correction — treat this as ground truth and revise:
${correction.trim()}`
      : ""
  }
  `.trim();

  const { text, sources } = await streamResearch(systemPrompt, userMessage, model);
  const { keyFindings, extendedReport } = splitSecondaryResearch(text);

  // Open the follow-up discussion automatically, as part of the same action —
  // not a separate step the PM has to remember to trigger.
  const discussionSystemPrompt = `${frameworks.experimentDiscussion()}\n\n## Context
Method: secondary_research
Initiative: ${experiment.initiative?.name ?? "unknown"}
Hypothesis: ${experiment.hypothesis ?? experiment.initiative?.hypothesis ?? "not provided"}
Success metric: ${experiment.successMetric ?? "not specified"}
Findings + Interpretation on record:
${text}`;
  const openingTurn = await streamChat(
    discussionSystemPrompt,
    [{ role: "user", content: "Let's start the discussion." }],
    undefined,
    model
  );

  const updated = await prisma.experiment.update({
    where: { id },
    data: {
      result: keyFindings,
      extendedReport: extendedReport || null,
      sources: JSON.stringify(sources),
      status: "completed",
      discussionThread: JSON.stringify([{ role: "ai", content: openingTurn }]),
      researchAccepted: false,
      researchAcceptedBy: null,
      researchAcceptedAt: null,
    },
  });

  return NextResponse.json(updated);
}
