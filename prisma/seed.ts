import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { id: "seed-workspace" },
    update: {},
    create: {
      id: "seed-workspace",
      name: "My Workspace",
    },
  });

  const product = await prisma.product.upsert({
    where: { id: "seed-product" },
    update: {},
    create: {
      id: "seed-product",
      workspaceId: workspace.id,
      name: "My Product",
      description: "A sample product to get you started.",
    },
  });

  const persona = await prisma.persona.upsert({
    where: { id: "seed-persona" },
    update: {},
    create: {
      id: "seed-persona",
      productId: product.id,
      name: "Power User",
      description: "A frequent user who wants to get things done fast.",
      jobsToBeDone: JSON.stringify([
        "Prioritize my backlog quickly",
        "Generate PRDs without starting from scratch",
      ]),
    },
  });

  const initiative = await prisma.initiative.upsert({
    where: { id: "seed-initiative" },
    update: {},
    create: {
      id: "seed-initiative",
      productId: product.id,
      name: "One-click PRD generation",
      problemStatement:
        "PMs spend hours writing PRDs from scratch for every feature.",
      hypothesis:
        "If Claude can draft a PRD from a one-liner, PMs will spend more time refining and less time writing.",
      status: "idea",
      riceReach: 500,
      riceImpact: 2,
      riceConfidence: 0.8,
      riceEffort: 1,
      riceScore: (500 * 2 * 0.8) / 1,
    },
  });

  console.log("Seed complete:", { workspace, product, persona, initiative });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
