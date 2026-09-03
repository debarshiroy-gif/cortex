import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Promotes an OST solution into a real Initiative, linking its evidence insights.
export async function POST(request: Request) {
  const body = await request.json();
  const {
    productId,
    solutionTitle,
    opportunityLabel,
    experiment,
    insightIds,
  } = body as {
    productId: string;
    solutionTitle: string;
    opportunityLabel: string;
    experiment: string;
    insightIds: string[];
  };

  if (!productId || !solutionTitle?.trim()) {
    return NextResponse.json(
      { error: "productId and solutionTitle are required" },
      { status: 400 }
    );
  }

  const initiative = await prisma.initiative.create({
    data: {
      productId,
      name: solutionTitle.trim(),
      problemStatement: opportunityLabel,
      hypothesis: experiment,
      status: "idea",
      insights: {
        create: insightIds.map((insightId) => ({ insightId })),
      },
    },
    include: { insights: true },
  });

  return NextResponse.json(initiative, { status: 201 });
}
