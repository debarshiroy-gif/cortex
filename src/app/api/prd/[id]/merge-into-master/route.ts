import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText, type ModelChoice } from "@/lib/llm";
import { frameworks } from "@/lib/frameworks";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { model } = body as { model?: ModelChoice };

  const gapPrd = await prisma.pRD.findUnique({
    where: { id },
    include: { initiative: { select: { id: true, name: true, baselineInitiativeId: true } } },
  });
  if (!gapPrd) {
    return NextResponse.json({ error: "PRD not found" }, { status: 404 });
  }
  if (!gapPrd.content) {
    return NextResponse.json({ error: "This PRD has no content to merge yet" }, { status: 400 });
  }
  if (!gapPrd.initiative?.baselineInitiativeId) {
    return NextResponse.json(
      { error: "This initiative has no baseline to merge into" },
      { status: 400 }
    );
  }

  const masterPrd = await prisma.pRD.findUnique({
    where: { initiativeId: gapPrd.initiative.baselineInitiativeId },
  });
  if (!masterPrd) {
    return NextResponse.json({ error: "The master initiative has no PRD to merge into" }, { status: 404 });
  }

  const userMessage = `
Master PRD (current source of truth):
"""
${masterPrd.content ?? "(empty)"}
"""

Gap PRD (just-completed enhancement, now delivered):
"""
${gapPrd.content}
"""

Merge the gap into the master as instructed.
  `.trim();

  const merged = await streamText(frameworks.prdMerge(), userMessage, 12000, model);

  const [updatedMaster] = await prisma.$transaction([
    prisma.pRD.update({
      where: { id: masterPrd.id },
      data: { content: merged.trim(), updatedAt: new Date() },
    }),
    prisma.pRD.update({
      where: { id: gapPrd.id },
      data: { mergedIntoMaster: true },
    }),
  ]);

  return NextResponse.json({ masterPrd: updatedMaster, masterInitiativeId: gapPrd.initiative.baselineInitiativeId });
}
