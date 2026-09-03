import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { attachInitiativeComputedFields } from "@/lib/initiativeSummary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  const initiatives = await prisma.initiative.findMany({
    where: productId ? { productId } : undefined,
    include: {
      features: {
        select: {
          id: true,
          name: true,
          status: true,
          requirements: { select: { regime: true } },
        },
      },
      meetingNotes: { select: { geminiNotetakerEnabled: true } },
      prd: { select: { status: true } },
    },
    orderBy: [{ riceScore: "desc" }, { createdAt: "desc" }],
  });

  const withComputedFields = initiatives.map(attachInitiativeComputedFields);

  return NextResponse.json(withComputedFields);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { productId, name, problemStatement, hypothesis, projectType, baselineInitiativeId } = body as {
    productId?: string;
    name?: string;
    problemStatement?: string;
    hypothesis?: string;
    projectType?: string;
    baselineInitiativeId?: string;
  };

  if (!productId || !name?.trim()) {
    return NextResponse.json(
      { error: "productId and name are required" },
      { status: 400 }
    );
  }

  if (
    projectType !== undefined &&
    !["greenfield", "regulated_greenfield", "brownfield"].includes(projectType)
  ) {
    return NextResponse.json(
      { error: "projectType must be one of: greenfield, regulated_greenfield, brownfield" },
      { status: 400 }
    );
  }

  if (projectType === "brownfield" && !baselineInitiativeId) {
    return NextResponse.json(
      { error: "baselineInitiativeId is required for brownfield initiatives" },
      { status: 400 }
    );
  }

  const initiative = await prisma.initiative.create({
    data: {
      productId,
      name: name.trim(),
      problemStatement,
      hypothesis,
      projectType: projectType ?? "greenfield",
      baselineInitiativeId: baselineInitiativeId || null,
    },
  });
  return NextResponse.json(initiative, { status: 201 });
}
