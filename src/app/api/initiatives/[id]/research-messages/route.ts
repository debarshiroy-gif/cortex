import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamChat, type ChatMessage, type ModelChoice } from "@/lib/llm";
import { frameworks } from "@/lib/frameworks";
import { extractProposedExperiments } from "@/lib/researchProposals";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { content, model } = body as { content?: string; model?: ModelChoice };

  if (!content?.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      insights: { include: { insight: { select: { summary: true, tags: true } } } },
      experiments: { orderBy: { createdAt: "desc" } },
      researchMessages: { orderBy: { createdAt: "asc" } },
      prototypeVersions: { orderBy: { versionNumber: "desc" } },
    },
  });

  if (!initiative) {
    return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
  }

  const pmMessage = await prisma.researchMessage.create({
    data: { initiativeId: id, role: "pm", content: content.trim() },
  });

  const priorTurns: ChatMessage[] = initiative.researchMessages.map((m) => ({
    role: m.role === "pm" ? "user" : "assistant",
    content: m.content,
  }));

  const insightLines = initiative.insights
    .map(({ insight }) => `- ${insight.summary}`)
    .join("\n");
  const experimentLines = initiative.experiments
    .map(
      (e) =>
        `- [${e.status}] ${e.method}${e.hypothesis ? `: ${e.hypothesis}` : ""}${
          e.result ? ` — result: ${e.result}` : ""
        }`
    )
    .join("\n");

  const latestPrototype = initiative.prototypeVersions[0];
  const prototypeStatus = latestPrototype
    ? `A prototype exists (v${latestPrototype.versionNumber}, kind: ${latestPrototype.kind}; ${
        initiative.prototypeVersions.length
      } version${initiative.prototypeVersions.length === 1 ? "" : "s"} total) — validation methods are unlocked${
        initiative.prototypeVersions.length >= 2 ? ", including ab_test" : " (ab_test needs a second version first)"
      }.`
    : "No prototype exists yet — validation methods are locked; propose strategy-gate methods only.";

  const systemPrompt = `${frameworks.researchPlanning()}

## This initiative

Name: ${initiative.name}
Problem statement: ${initiative.problemStatement ?? "not provided"}
Hypothesis: ${initiative.hypothesis ?? "not provided"}

Prototype status: ${prototypeStatus}

Insights already on file for this initiative:
${insightLines || "- none yet"}

Experiments already planned/run for this initiative:
${experimentLines || "- none yet"}`;

  const raw = await streamChat(
    systemPrompt,
    [...priorTurns, { role: "user", content: content.trim() }],
    undefined,
    model
  );

  const { prose, proposals } = extractProposedExperiments(raw);

  const aiMessage = await prisma.researchMessage.create({
    data: {
      initiativeId: id,
      role: "ai",
      content: prose,
      proposedExperiments: JSON.stringify(proposals),
    },
  });

  if (initiative.researchGateStatus === "undecided") {
    await prisma.initiative.update({
      where: { id },
      data: { researchGateStatus: "needed" },
    });
  }

  return NextResponse.json({ pmMessage, aiMessage }, { status: 201 });
}
