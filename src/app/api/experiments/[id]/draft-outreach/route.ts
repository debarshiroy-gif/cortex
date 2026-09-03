import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText } from "@/lib/anthropic";
import { frameworks } from "@/lib/frameworks";

interface DraftReply {
  targetAudience?: string;
  outreachDraft: string;
}

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
  if (experiment.method !== "survey" && experiment.method !== "fake_door_test") {
    return NextResponse.json(
      { error: "This experiment's method must be survey or fake_door_test" },
      { status: 400 }
    );
  }

  let discussionSection = "";
  try {
    const thread = JSON.parse(experiment.discussionThread) as { role: string; content: string }[];
    if (Array.isArray(thread) && thread.length > 0) {
      discussionSection = `\nDiscussion with the PM about the success metric (use any refinement agreed here when drafting questions):\n${thread
        .map((t) => `${t.role === "pm" ? "PM" : "AI"}: ${t.content}`)
        .join("\n")}\n`;
    }
  } catch {
    // no discussion yet — proceed without it
  }

  const systemPrompt = frameworks.outreachDrafting();
  const userMessage = `
Method: ${experiment.method}

Initiative: ${experiment.initiative?.name ?? "unknown"}
Problem statement: ${experiment.initiative?.problemStatement ?? "not provided"}
Hypothesis: ${experiment.hypothesis ?? experiment.initiative?.hypothesis ?? "not provided"}
Success metric: ${experiment.successMetric ?? "not specified"}
${discussionSection}
Draft the material for this method as instructed.
  `.trim();

  const raw = await streamText(systemPrompt, userMessage);

  let parsed: DraftReply;
  try {
    const cleaned = raw.replace(/^```json\s*/m, "").replace(/\s*```$/m, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse Claude response", raw },
      { status: 502 }
    );
  }

  const updated = await prisma.experiment.update({
    where: { id },
    data: {
      outreachDraft: parsed.outreachDraft,
      targetAudience: experiment.method === "survey" ? parsed.targetAudience ?? null : null,
    },
  });

  return NextResponse.json(updated);
}
