import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Source {
  url: string;
  title: string;
}

function parseSources(json: string): Source[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: { initiative: { select: { name: true } } },
  });

  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (!experiment.extendedReport) {
    return NextResponse.json({ error: "No extended report to export yet" }, { status: 404 });
  }

  const initiativeName = experiment.initiative?.name ?? "initiative";
  const sources = parseSources(experiment.sources);

  const markdown = [
    `# Secondary Research: ${initiativeName}`,
    ``,
    `**Hypothesis:** ${experiment.hypothesis ?? "not provided"}`,
    `**Success metric:** ${experiment.successMetric ?? "not specified"}`,
    ``,
    `---`,
    ``,
    `## Key Findings`,
    ``,
    experiment.result ?? "_No findings recorded._",
    ``,
    `---`,
    ``,
    `## Extended Report`,
    ``,
    experiment.extendedReport,
    ``,
    `---`,
    ``,
    `## Sources`,
    ``,
    sources.length > 0
      ? sources.map((s) => `- [${s.title}](${s.url})`).join("\n")
      : "_No sources cited._",
  ].join("\n");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": `attachment; filename="secondary-research-${initiativeName
        .replace(/\s+/g, "-")
        .toLowerCase()}.md"`,
    },
  });
}
