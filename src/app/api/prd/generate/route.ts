import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText } from "@/lib/anthropic";
import { frameworks } from "@/lib/frameworks";
import { getInitiativeResearchFindings } from "@/lib/researchFindings";
import { extractPrdStories } from "@/lib/prdStories";
import { stripHtml } from "@/lib/readability";

export async function POST(request: Request) {
  const body = await request.json();
  const { featureId, initiativeId } = body as { featureId?: string; initiativeId?: string };

  if (initiativeId) {
    return generateInitiativePrd(initiativeId);
  }

  if (!featureId) {
    return NextResponse.json(
      { error: "featureId or initiativeId is required" },
      { status: 400 }
    );
  }

  const feature = await prisma.feature.findUnique({
    where: { id: featureId },
    include: {
      initiative: {
        include: {
          product: {
            include: { personas: true },
          },
        },
      },
    },
  });

  if (!feature) {
    return NextResponse.json({ error: "Feature not found" }, { status: 404 });
  }

  const { initiative } = feature;
  const personas = initiative.product.personas;

  const systemPrompt = frameworks.prd();
  const userMessage = `
Feature name: "${feature.name}"
Kano category: ${feature.kanoCategory ?? "not specified"}

Initiative context:
- Name: ${initiative.name}
- Problem statement: ${initiative.problemStatement ?? "not provided"}
- Hypothesis: ${initiative.hypothesis ?? "not provided"}
- Status: ${initiative.status}
${initiative.riceScore != null ? `- RICE score: ${initiative.riceScore.toFixed(1)}` : ""}

Personas for this product:
${
  personas.length > 0
    ? personas
        .map((p) => {
          const jtbd = JSON.parse(p.jobsToBeDone) as string[];
          return `- ${p.name}: ${p.description ?? ""}${
            jtbd.length > 0 ? ` | Jobs: ${jtbd.join("; ")}` : ""
          }`;
        })
        .join("\n")
    : "- No personas defined yet"
}

Draft a complete PRD using the template structure. Mark any inferred sections with "ASSUMPTION:" so the PM can review them.
  `.trim();

  const prdContent = await streamText(systemPrompt, userMessage);

  // Upsert the PRD record
  const prd = await prisma.pRD.upsert({
    where: { featureId },
    update: { problem: prdContent, status: "draft", updatedAt: new Date() },
    create: { featureId, problem: prdContent, status: "draft" },
  });

  return NextResponse.json({ prd, content: prdContent });
}

async function generateInitiativePrd(initiativeId: string) {
  const initiative = await prisma.initiative.findUnique({
    where: { id: initiativeId },
    include: { product: true },
  });
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
This initiative is an ENHANCEMENT to an already-shipped feature, not a new build from scratch.
Below is the baseline PRD describing what's already live in production — use it to understand
current behavior. Frame section 6 (In-Scope Work) as the delta only: what's changing, being
added, or being removed relative to this baseline. Do not restate unchanged existing behavior
as if it were new work.

--- EXISTING PRODUCTION BASELINE ---
${baselinePrd.content}
--- END BASELINE ---
`;
    }
  }

  const [brd, findings, prototypeVersions] = await Promise.all([
    prisma.bRD.findUnique({ where: { initiativeId } }),
    getInitiativeResearchFindings(initiativeId),
    prisma.prototypeVersion.findMany({ where: { initiativeId }, orderBy: { versionNumber: "asc" } }),
  ]);

  const prototypeSummaries = prototypeVersions.map((v) => {
    if (v.kind === "backend") {
      return `Version ${v.versionNumber} (backend spec):\n${v.content}`;
    }
    const focusComment = v.content.match(/<!--\s*(.*?)\s*-->/);
    const excerpt = stripHtml(v.content).slice(0, 1500);
    return `Version ${v.versionNumber} (ui)${
      focusComment ? ` — ${focusComment[1]}` : ""
    } — text extracted from the mockup (any numbers/timings shown in it are fabricated sample content for visual realism, not real measurements):\n${excerpt}`;
  });

  const userMessage = `
${baselineContext}
Today's date: ${new Date().toISOString().split("T")[0]}
Initiative: ${initiative.name}
Product: ${initiative.product.name}${initiative.product.description ? ` — ${initiative.product.description}` : ""}
Problem statement: ${initiative.problemStatement ?? "not provided"}
Hypothesis: ${initiative.hypothesis ?? "not provided"}
Strategy gate decision: ${initiative.strategyGateDecision}${
    initiative.strategyGateNote ? ` — ${initiative.strategyGateNote}` : ""
  }

BRD:
${brd?.content ?? "No BRD has been drafted yet."}

Research & validation findings:
${findings.length > 0 ? findings.map((f) => `- ${f}`).join("\n") : "- No completed research or validation yet."}

Prototype(s) built:
${prototypeSummaries.length > 0 ? prototypeSummaries.join("\n\n") : "No prototype has been built yet."}

Draft the PRD as instructed.
  `.trim();

  const raw = await streamText(frameworks.prdInitiative(), userMessage, 12000);
  const { content, stories } = extractPrdStories(raw);

  const prd = await prisma.pRD.upsert({
    where: { initiativeId },
    update: { content, stories: JSON.stringify(stories), status: "draft", updatedAt: new Date() },
    create: { initiativeId, content, stories: JSON.stringify(stories), status: "draft" },
  });

  return NextResponse.json(prd, { status: 201 });
}
