import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { streamText } from "@/lib/anthropic";
import { frameworks } from "@/lib/frameworks";

const MAX_FILE_CHARS = 100_000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { fileName, fileContent } = body as { fileName?: string; fileContent?: string };

  if (!fileContent?.trim()) {
    return NextResponse.json({ error: "fileContent is required" }, { status: 400 });
  }

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: { initiative: { select: { name: true, hypothesis: true } } },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (experiment.method !== "data_analysis") {
    return NextResponse.json(
      { error: "This experiment's method is not data_analysis" },
      { status: 400 }
    );
  }

  const truncated = fileContent.slice(0, MAX_FILE_CHARS);

  const systemPrompt = frameworks.dataAnalysis();
  const userMessage = `
Initiative: ${experiment.initiative?.name ?? "unknown"}
Hypothesis: ${experiment.hypothesis ?? experiment.initiative?.hypothesis ?? "not provided"}
Success metric: ${experiment.successMetric ?? "not specified"}

CSV file (${fileName ?? "uploaded file"}):
"""
${truncated}
"""

Analyze this as instructed.
  `.trim();

  const result = await streamText(systemPrompt, userMessage);

  const updated = await prisma.experiment.update({
    where: { id },
    data: {
      dataFileName: fileName || null,
      dataFileContent: fileContent,
      result,
      status: "completed",
    },
  });

  return NextResponse.json(updated);
}
