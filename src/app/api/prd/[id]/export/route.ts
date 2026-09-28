import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { PrdStory } from "@/lib/prdStories";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const prd = await prisma.pRD.findUnique({
    where: { id },
    include: {
      feature: {
        include: {
          initiative: { include: { product: true } },
          requirements: { orderBy: { createdAt: "asc" } },
        },
      },
      initiative: { include: { product: true } },
    },
  });

  if (!prd) {
    return NextResponse.json({ error: "PRD not found" }, { status: 404 });
  }

  if (prd.initiativeId && prd.initiative) {
    const stories = (() => {
      try {
        const parsed = JSON.parse(prd.stories);
        return Array.isArray(parsed) ? (parsed as PrdStory[]) : [];
      } catch {
        return [] as PrdStory[];
      }
    })();

    const jiraSection = [
      `## JIRA Breakdown`,
      ``,
      `**Epic:** ${prd.initiative.name}`,
      ``,
      ...stories.flatMap((s, i) => [
        `### Story ${i + 1}: ${s.title}${s.phase ? ` _(${s.phase})_` : ""}`,
        s.persona ? `**As a:** ${s.persona}` : "",
        ``,
        s.description,
        ``,
        ...(s.background ? [`**Background:**`, s.background, ``] : []),
        ...(s.linkedStoryTitles && s.linkedStoryTitles.length > 0
          ? [`**Linked stories:** ${s.linkedStoryTitles.join(", ")}`, ``]
          : []),
        ...(s.logic ? [`**Logic:**`, s.logic, ``] : []),
        ...(s.mapping ? [`**Mapping:**`, s.mapping, ``] : []),
        ...(s.uiScreens ? [`**UI screens:**`, s.uiScreens, ``] : []),
        `**Acceptance Criteria:**`,
        ...s.acceptanceCriteria.map((c) => `- [ ] ${c}`),
        ``,
      ]),
    ].join("\n");

    const markdown = [
      `# PRD: ${prd.initiative.name}`,
      ``,
      `**Product:** ${prd.initiative.product.name}`,
      `**Status:** ${prd.status}`,
      `**Last updated:** ${prd.updatedAt.toISOString().split("T")[0]}`,
      ``,
      `---`,
      ``,
      prd.content ?? "_No content generated yet._",
      ``,
      `---`,
      ``,
      jiraSection,
    ].join("\n");

    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="prd-${prd.initiative.name.replace(/\s+/g, "-").toLowerCase()}.md"`,
      },
    });
  }

  if (!prd.feature) {
    return NextResponse.json({ error: "PRD has no feature or initiative" }, { status: 404 });
  }

  const userStories = JSON.parse(prd.userStories) as string[];
  const openQuestions = JSON.parse(prd.openQuestions) as string[];

  // Acceptance criteria and edge cases are pulled from linked Requirement rows,
  // not free text — the PRD's narrative sections (problem/goals/non-goals/user
  // stories) stay exactly as generated.
  const parseList = (json: string): string[] => {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const regimeLabel = (regime: string) =>
    regime === "regulated" ? "regulated" : "non-regulated";

  const acceptanceCriteriaSection = prd.feature.requirements
    .filter((r) => parseList(r.acceptanceCriteria).length > 0)
    .map(
      (r) =>
        `### ${r.requirementText} (${regimeLabel(r.regime)})\n${parseList(
          r.acceptanceCriteria
        )
          .map((c) => `- [ ] ${c}`)
          .join("\n")}`
    )
    .join("\n\n");

  const edgeCasesSection = prd.feature.requirements
    .filter((r) => parseList(r.edgeCases).length > 0)
    .map(
      (r) =>
        `### ${r.requirementText}\n${parseList(r.edgeCases)
          .map((c) => `- ${c}`)
          .join("\n")}`
    )
    .join("\n\n");

  const markdown = [
    `# PRD: ${prd.feature.name}`,
    ``,
    `**Product:** ${prd.feature.initiative.product.name}`,
    `**Initiative:** ${prd.feature.initiative.name}`,
    `**Status:** ${prd.status}`,
    `**Last updated:** ${prd.updatedAt.toISOString().split("T")[0]}`,
    ``,
    `---`,
    ``,
    prd.problem ?? "",
    ``,
    userStories.length > 0
      ? `## User Stories\n${userStories.map((s) => `- ${s}`).join("\n")}`
      : "",
    ``,
    acceptanceCriteriaSection
      ? `## Acceptance Criteria\n${acceptanceCriteriaSection}`
      : "## Acceptance Criteria\n_No linked Requirements have acceptance criteria yet._",
    ``,
    edgeCasesSection
      ? `## Edge Cases\n${edgeCasesSection}`
      : "## Edge Cases\n_No linked Requirements have edge cases yet._",
    ``,
    openQuestions.length > 0
      ? `## Open Questions\n${openQuestions.map((q) => `- ${q}`).join("\n")}`
      : "",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": `attachment; filename="prd-${prd.feature.name.replace(/\s+/g, "-").toLowerCase()}.md"`,
    },
  });
}
