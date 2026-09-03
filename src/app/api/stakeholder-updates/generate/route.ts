import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText } from "@/lib/anthropic";
import { frameworks } from "@/lib/frameworks";

const PRODUCT_ID = "seed-product";

export async function POST(request: Request) {
  const body = await request.json();
  const { period, releaseId } = body;

  const [recentReleases, okrs] = await Promise.all([
    prisma.release.findMany({
      where: { productId: PRODUCT_ID },
      include: {
        features: {
          include: { feature: { select: { name: true, status: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.oKR.findMany({
      where: { productId: PRODUCT_ID },
      include: { metric: { select: { name: true, unit: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const releaseLines = recentReleases.map((r) => {
    const featureNames = r.features
      .map((rf: { feature: { name: string } }) => rf.feature.name)
      .join(", ");
    return `- ${r.name} (${r.tier})${r.date ? ` — ${new Date(r.date).toISOString().split("T")[0]}` : ""}${featureNames ? `\n  Features: ${featureNames}` : ""}`;
  });

  const okrLines = okrs.map((okr) => {
    let krs: Array<{
      id?: string;
      text?: string;
      current?: number;
      target?: number;
      unit?: string;
    }> = [];
    try {
      krs = JSON.parse(okr.keyResults);
    } catch {
      krs = [];
    }
    const krLines = krs
      .map((kr) => {
        const pct =
          kr.current != null && kr.target
            ? Math.round((kr.current / kr.target) * 100)
            : null;
        return `  - ${kr.text ?? ""}${pct != null ? ` (${kr.current}/${kr.target}${kr.unit ? " " + kr.unit : ""} = ${pct}%)` : ""}`;
      })
      .join("\n");
    return `Objective: ${okr.objective} [${okr.quarter}]\n${krLines}`;
  });

  const systemPrompt = await frameworks.stakeholderUpdate();

  const userMessage = `Period: ${period || "current quarter"}

Recent Releases:
${releaseLines.length > 0 ? releaseLines.join("\n") : "No recent releases."}

OKR Progress:
${okrLines.length > 0 ? okrLines.join("\n\n") : "No OKRs defined."}

Draft a stakeholder update following the framework. Return valid JSON with this exact shape:
{
  "tldr": "2-3 sentence max, plain language, no softening",
  "wins": ["string", ...],
  "risks": ["string — do not soften flagged risks", ...],
  "asks": ["string", ...],
  "summary": "paragraph"
}

Be direct. Do not soften risks. TL;DR must be 2-3 sentences only.`;

  const raw = await streamText(systemPrompt, userMessage);
  const cleaned = raw
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  return NextResponse.json(parsed);
}
