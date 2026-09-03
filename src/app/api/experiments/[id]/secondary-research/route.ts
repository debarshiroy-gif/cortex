import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamResearch, streamChat } from "@/lib/anthropic";
import { frameworks } from "@/lib/frameworks";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const systemPrompt = frameworks.secondaryResearch();
  const userMessage = `
Initiative: ${experiment.initiative?.name ?? "unknown"}
Problem statement: ${experiment.initiative?.problemStatement ?? "not provided"}
Hypothesis being checked: ${experiment.hypothesis ?? experiment.initiative?.hypothesis ?? "not provided"}
Success metric to keep in mind: ${experiment.successMetric ?? "not specified"}

Research this and report Findings then Interpretation as instructed.
  `.trim();

  const { text, sources } = await streamResearch(systemPrompt, userMessage);

  // Open the follow-up discussion automatically, as part of the same action —
  // not a separate step the PM has to remember to trigger.
  const discussionSystemPrompt = `${frameworks.experimentDiscussion()}\n\n## Context
Method: secondary_research
Initiative: ${experiment.initiative?.name ?? "unknown"}
Hypothesis: ${experiment.hypothesis ?? experiment.initiative?.hypothesis ?? "not provided"}
Success metric: ${experiment.successMetric ?? "not specified"}
Findings + Interpretation on record:
${text}`;
  const openingTurn = await streamChat(discussionSystemPrompt, [
    { role: "user", content: "Let's start the discussion." },
  ]);

  const updated = await prisma.experiment.update({
    where: { id },
    data: {
      result: text,
      sources: JSON.stringify(sources),
      status: "completed",
      discussionThread: JSON.stringify([{ role: "ai", content: openingTurn }]),
    },
  });

  return NextResponse.json(updated);
}
