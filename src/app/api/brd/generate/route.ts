import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText, type ModelChoice } from "@/lib/llm";
import { frameworks } from "@/lib/frameworks";
import { getInitiativeResearchExperiments } from "@/lib/researchFindings";
import { formatExperimentCitation } from "@/lib/experimentCitation";

const SOURCE_TEAM_LABEL: Record<string, string> = {
  compliance: "Compliance",
  operations: "Operations",
  finance: "Finance",
  business: "Business",
  risk: "Risk",
  data_science: "Data Science",
  product_manager: "Product Manager",
};

export async function POST(request: Request) {
  const body = await request.json();
  const { initiativeId, model } = body as { initiativeId?: string; model?: ModelChoice };

  if (!initiativeId) {
    return NextResponse.json({ error: "initiativeId is required" }, { status: 400 });
  }

  const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
  if (!initiative) {
    return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
  }

  let baselineContext = "";
  if (initiative.baselineInitiativeId) {
    const baselinePrd = await prisma.pRD.findUnique({
      where: { initiativeId: initiative.baselineInitiativeId },
    });
    if (baselinePrd?.content) {
      baselineContext = `
This initiative enhances an already-shipped feature; below is its baseline PRD describing what's
already live in production. Frame the Business Objective around what's CHANGING or being ADDED,
not a restatement of what already exists.

--- EXISTING PRODUCTION BASELINE ---
${baselinePrd.content}
--- END BASELINE ---
`;
    }
  }

  const [experiments, approvedInputs, approvedMeetingNotes] = await Promise.all([
    getInitiativeResearchExperiments(initiativeId),
    prisma.brdInput.findMany({ where: { initiativeId, status: "approved" } }),
    prisma.meetingNote.findMany({ where: { linkedInitiativeId: initiativeId, status: "approved" } }),
  ]);
  const findings = experiments.map(formatExperimentCitation);

  const inputsByTeam = approvedInputs.reduce<Record<string, typeof approvedInputs>>((acc, i) => {
    (acc[i.sourceTeam] ??= []).push(i);
    return acc;
  }, {});

  const stakeholderSection = Object.keys(SOURCE_TEAM_LABEL)
    .map((team) => {
      const items = inputsByTeam[team] ?? [];
      const label = SOURCE_TEAM_LABEL[team];
      if (items.length === 0) return `### ${label}\n(no approved input yet)`;
      return `### ${label}\n${items.map((i) => `- [${i.channelType}] ${i.content}`).join("\n")}`;
    })
    .join("\n\n");

  const systemPrompt = frameworks.brdTemplate();
  const userMessage = `
${baselineContext}
Initiative: ${initiative.name}
Problem statement: ${initiative.problemStatement ?? "not provided"}
Hypothesis: ${initiative.hypothesis ?? "not provided"}
Strategy gate decision: ${initiative.strategyGateDecision}${
    initiative.strategyGateNote ? ` — ${initiative.strategyGateNote}` : ""
  }

Research & evidence (from strategy-gate experiments):
${findings.length > 0 ? findings.map((f) => `- ${f}`).join("\n") : "- No completed research yet."}

Approved stakeholder input, by team:

${stakeholderSection}

Approved meeting notes for this initiative:
${
    approvedMeetingNotes.length > 0
      ? approvedMeetingNotes.map((n) => `- [${n.sourceType}] ${n.rawContent}`).join("\n")
      : "- None yet."
  }

Draft the BRD as instructed.
  `.trim();

  const content = await streamText(systemPrompt, userMessage, 8192, model);

  const consideredAt = new Date();

  const [brd] = await Promise.all([
    prisma.bRD.upsert({
      where: { initiativeId },
      update: { content, status: "draft", updatedAt: new Date() },
      create: { initiativeId, content, status: "draft" },
    }),
    prisma.brdInput.updateMany({
      where: { id: { in: approvedInputs.map((i) => i.id) } },
      data: { consideredInBrdAt: consideredAt },
    }),
    prisma.meetingNote.updateMany({
      where: { id: { in: approvedMeetingNotes.map((n) => n.id) } },
      data: { consideredInBrdAt: consideredAt },
    }),
    prisma.experiment.updateMany({
      where: { id: { in: experiments.map((e) => e.id) } },
      data: { consideredInBrdAt: consideredAt },
    }),
    ...(initiative.strategyGateDecision !== "pending"
      ? [
          prisma.initiative.update({
            where: { id: initiativeId },
            data: { strategyGateConsideredInBrdAt: consideredAt },
          }),
        ]
      : []),
  ]);

  return NextResponse.json(brd);
}
