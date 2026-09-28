import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamChat, type ChatMessage, type ModelChoice } from "@/lib/llm";
import { frameworks } from "@/lib/frameworks";

interface DiscussionTurn {
  role: "pm" | "ai";
  content: string;
}

function parseThread(json: string): DiscussionTurn[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { content, model } = body as { content?: string; model?: ModelChoice };

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: { initiative: { select: { name: true, hypothesis: true } } },
  });
  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (experiment.method !== "secondary_research" && experiment.method !== "survey") {
    return NextResponse.json(
      { error: "Discussion is only available for secondary_research and survey experiments" },
      { status: 400 }
    );
  }

  const thread = parseThread(experiment.discussionThread);

  const contextLines = [
    `Method: ${experiment.method}`,
    `Initiative: ${experiment.initiative?.name ?? "unknown"}`,
    `Hypothesis: ${experiment.hypothesis ?? experiment.initiative?.hypothesis ?? "not provided"}`,
    `Success metric: ${experiment.successMetric ?? "not specified"}`,
  ];
  if (experiment.method === "secondary_research") {
    contextLines.push(`Findings + Interpretation on record:\n${experiment.result ?? "none yet"}`);
  }

  const systemPrompt = `${frameworks.experimentDiscussion()}\n\n## Context\n${contextLines.join("\n")}`;

  const priorTurns: ChatMessage[] = thread.map((t) => ({
    role: t.role === "pm" ? "user" : "assistant",
    content: t.content,
  }));

  const pmTurn: DiscussionTurn | null = content?.trim() ? { role: "pm", content: content.trim() } : null;

  const messages: ChatMessage[] = pmTurn
    ? [...priorTurns, { role: "user", content: pmTurn.content }]
    : priorTurns.length > 0
      ? priorTurns
      : [{ role: "user", content: "Let's start the discussion." }];

  const reply = await streamChat(systemPrompt, messages, undefined, model);

  const updatedThread: DiscussionTurn[] = [
    ...thread,
    ...(pmTurn ? [pmTurn] : []),
    { role: "ai", content: reply },
  ];

  const updated = await prisma.experiment.update({
    where: { id },
    data: { discussionThread: JSON.stringify(updatedThread) },
  });

  return NextResponse.json(updated);
}
