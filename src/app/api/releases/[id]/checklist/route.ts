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

  const release = await prisma.release.findUnique({
    where: { id },
    include: {
      features: {
        include: {
          feature: {
            select: {
              name: true,
              status: true,
              initiative: { select: { name: true } },
              prd: { select: { goals: true, acceptanceCriteria: true } },
            },
          },
        },
      },
    },
  });

  if (!release) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const systemPrompt = await frameworks.launchChecklist();

  const featureLines = release.features.map((rf) => {
    const f = rf.feature;
    let line = `- ${f.name} (${f.status})`;
    if (f.initiative?.name) line += ` — Initiative: ${f.initiative.name}`;
    if (f.prd?.goals) line += `\n  Goals: ${f.prd.goals}`;
    if (f.prd?.acceptanceCriteria) {
      const ac = f.prd.acceptanceCriteria;
      try {
        const parsed = JSON.parse(ac);
        if (Array.isArray(parsed) && parsed.length > 0) {
          line += `\n  Acceptance Criteria: ${parsed.join("; ")}`;
        }
      } catch {
        if (ac) line += `\n  Acceptance Criteria: ${ac}`;
      }
    }
    return line;
  });

  const userMessage = `Release: ${release.name}
Tier: ${release.tier}
Date: ${release.date ? new Date(release.date).toISOString().split("T")[0] : "TBD"}

Features in this release:
${featureLines.length > 0 ? featureLines.join("\n") : "No features linked yet."}

Generate a launch checklist for this ${release.tier} release. Use the actual feature names above — no placeholders. Scope the checklist to the tier (major releases need more gates than patch releases).`;

  const raw = await streamText(systemPrompt, userMessage, undefined, model);
  const checklist = raw
    .replace(/^```\w*\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  await prisma.release.update({
    where: { id },
    data: { checklist },
  });

  return NextResponse.json({ checklist });
}
