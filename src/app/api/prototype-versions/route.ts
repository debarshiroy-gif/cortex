import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText, type ModelChoice } from "@/lib/llm";
import { frameworks } from "@/lib/frameworks";
import { getInitiativeResearchFindings } from "@/lib/researchFindings";
import { parsePrototypeReply } from "@/lib/prototypeParsing";
import { computeReadability } from "@/lib/readability";

const SOURCE_MODES = ["brd", "experiments", "prompt"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const initiativeId = searchParams.get("initiativeId");

  if (!initiativeId) {
    return NextResponse.json({ error: "initiativeId is required" }, { status: 400 });
  }

  const versions = await prisma.prototypeVersion.findMany({
    where: { initiativeId },
    orderBy: { versionNumber: "asc" },
  });
  return NextResponse.json(versions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { initiativeId, sourceMode, promptText, model } = body as {
    initiativeId?: string;
    sourceMode?: string;
    promptText?: string;
    model?: ModelChoice;
  };

  if (!initiativeId || !sourceMode) {
    return NextResponse.json(
      { error: "initiativeId and sourceMode are required" },
      { status: 400 }
    );
  }
  if (!SOURCE_MODES.includes(sourceMode as (typeof SOURCE_MODES)[number])) {
    return NextResponse.json(
      { error: `sourceMode must be one of: ${SOURCE_MODES.join(", ")}` },
      { status: 400 }
    );
  }
  if (sourceMode === "prompt" && !promptText?.trim()) {
    return NextResponse.json(
      { error: "promptText is required when sourceMode is prompt" },
      { status: 400 }
    );
  }

  const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
  if (!initiative) {
    return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
  }

  const existingVersions = await prisma.prototypeVersion.findMany({
    where: { initiativeId },
    orderBy: { versionNumber: "desc" },
  });

  const sections: string[] = [
    `Initiative: ${initiative.name}`,
    `Problem statement: ${initiative.problemStatement ?? "not provided"}`,
  ];

  if (initiative.baselineInitiativeId) {
    const [baselinePrd, approvedMeetingNotes] = await Promise.all([
      prisma.pRD.findUnique({ where: { initiativeId: initiative.baselineInitiativeId } }),
      prisma.meetingNote.findMany({ where: { linkedInitiativeId: initiativeId, status: "approved" } }),
    ]);
    if (baselinePrd?.content) {
      sections.push(`
This initiative is an ENHANCEMENT to an already-shipped feature. Build ONLY the gap — the
new or changed functionality proposed by the BRD, meeting notes, and research below — not the
whole existing system. Below is the baseline PRD describing what's already live.

--- EXISTING PRODUCTION BASELINE ---
${baselinePrd.content}
--- END BASELINE ---
`);
    }
    if (approvedMeetingNotes.length > 0) {
      sections.push(
        `Approved meeting notes for this initiative:\n${approvedMeetingNotes
          .map((n) => `- [${n.sourceType}] ${n.rawContent}`)
          .join("\n")}`
      );
    }
  }

  if (sourceMode === "brd") {
    const brd = await prisma.bRD.findUnique({ where: { initiativeId } });
    if (!brd?.content) {
      return NextResponse.json(
        { error: "No BRD exists yet for this initiative — generate one first" },
        { status: 400 }
      );
    }
    sections.push(`BRD:\n${brd.content}`);
  } else if (sourceMode === "experiments") {
    const findings = await getInitiativeResearchFindings(initiativeId);
    if (findings.length === 0) {
      return NextResponse.json(
        { error: "No completed experiments exist yet for this initiative" },
        { status: 400 }
      );
    }
    sections.push(`Research findings:\n${findings.map((f) => `- ${f}`).join("\n")}`);
  } else if (existingVersions.length > 0) {
    // "prompt" mode iterates on the most recent version, when one exists.
    const prior = existingVersions[0];
    sections.push(
      `Current prototype (version ${prior.versionNumber}, kind: ${prior.kind}):\n${prior.content}`
    );
  }

  if (promptText?.trim()) {
    sections.push(`PM instruction: ${promptText.trim()}`);
  }

  const userMessage = sections.join("\n\n");
  const raw = await streamText(frameworks.prototypeGeneration(), userMessage, 16000, model);

  let parsed;
  try {
    parsed = parsePrototypeReply(raw);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse the model's prototype reply" },
      { status: 502 }
    );
  }

  const versionNumber = existingVersions.length > 0 ? existingVersions[0].versionNumber + 1 : 1;

  const version = await prisma.prototypeVersion.create({
    data: {
      initiativeId,
      versionNumber,
      kind: parsed.kind,
      sourceMode,
      promptText: promptText?.trim() || null,
      content: parsed.content,
      readabilityScore: parsed.kind === "ui" ? computeReadability(parsed.content) : null,
    },
  });

  return NextResponse.json(version, { status: 201 });
}
