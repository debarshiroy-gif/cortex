import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const requirement = await prisma.requirement.findUnique({
    where: { id },
    include: {
      feature: { include: { initiative: { include: { product: true } } } },
      auditTrail: { orderBy: { timestamp: "asc" } },
    },
  });

  if (!requirement) {
    return new Response("Requirement not found", { status: 404 });
  }

  const acceptanceCriteria = JSON.parse(requirement.acceptanceCriteria) as string[];
  const edgeCases = JSON.parse(requirement.edgeCases) as string[];

  const lines: string[] = [
    `# Audit Trail — Requirement`,
    ``,
    `**Product:** ${requirement.feature.initiative.product.name}`,
    `**Initiative:** ${requirement.feature.initiative.name}`,
    `**Feature:** ${requirement.feature.name}`,
    `**Requirement ID:** ${requirement.id}`,
    `**Exported:** ${new Date().toISOString()}`,
    ``,
    `---`,
    ``,
    `## Requirement`,
    ``,
    `**Regime:** ${requirement.regime}`,
    `**Gate status:** ${requirement.gateStatus}`,
    `**Text:** ${requirement.requirementText}`,
    `**Owner:** ${requirement.ownerName ?? "—"}`,
    `**Drafted by:** ${requirement.draftedBy}`,
    `**Source / provenance:** ${requirement.sourceProvenance ?? "— none —"}`,
    `**Risk if wrong:** ${requirement.riskIfWrong ?? "—"}`,
    `**Linked insight:** ${requirement.linkedInsightId ?? "—"}`,
    `**Linked prototype area:** ${requirement.linkedPrototypeArea ?? "—"}`,
    ``,
    acceptanceCriteria.length > 0
      ? `**Acceptance criteria:**\n${acceptanceCriteria.map((c) => `- ${c}`).join("\n")}`
      : `**Acceptance criteria:** —`,
    ``,
    edgeCases.length > 0
      ? `**Edge cases:**\n${edgeCases.map((c) => `- ${c}`).join("\n")}`
      : `**Edge cases:** —`,
    ``,
    `**Verified by:** ${requirement.verifiedByName ?? "—"}${
      requirement.verifiedByDate
        ? ` on ${requirement.verifiedByDate.toISOString().split("T")[0]}`
        : ""
    }`,
    `**Signed off:** ${requirement.signOffApproved ? "Yes" : "No"}${
      requirement.signOffBy ? ` by ${requirement.signOffBy}` : ""
    }${
      requirement.signOffDate
        ? ` on ${requirement.signOffDate.toISOString().split("T")[0]}`
        : ""
    }`,
    ``,
    `---`,
    ``,
    `## Audit trail (${requirement.auditTrail.length} events)`,
    ``,
    `Answers: "Can we show how this spec was produced?"`,
    ``,
    `| Timestamp | Actor | Action | Note |`,
    `|---|---|---|---|`,
    ...requirement.auditTrail.map(
      (entry) =>
        `| ${entry.timestamp.toISOString()} | ${entry.actor} | ${entry.action} | ${
          entry.note?.replace(/\|/g, "\\|") ?? ""
        } |`
    ),
  ];

  const report = lines.join("\n");

  return new Response(report, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": `attachment; filename="audit-trail-${requirement.id}.md"`,
    },
  });
}
