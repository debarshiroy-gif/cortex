import { prisma } from "@/lib/db";
import { formatExperimentCitation } from "@/lib/experimentCitation";

// Completed research for an Initiative, whether the Experiment was planned directly
// against it or arrived indirectly via one of its linked Insights — merged and
// de-duplicated so a PRD's prompt sees each finding exactly once.
export async function getInitiativeResearchFindings(initiativeId: string): Promise<string[]> {
  const [direct, indirect] = await Promise.all([
    prisma.experiment.findMany({
      where: { initiativeId, status: "completed" },
    }),
    prisma.experiment.findMany({
      where: {
        insight: { initiatives: { some: { initiativeId } } },
        result: { not: null },
      },
    }),
  ]);

  const byId = new Map(direct.map((e) => [e.id, e]));
  for (const e of indirect) byId.set(e.id, e);

  return Array.from(byId.values()).map(formatExperimentCitation);
}
