import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeRegimeSummary } from "@/lib/regimeSummary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const initiativeId = searchParams.get("initiativeId");
  const productId = searchParams.get("productId");

  const features = await prisma.feature.findMany({
    where: initiativeId
      ? { initiativeId }
      : productId
      ? { initiative: { productId } }
      : undefined,
    include: {
      prd: { select: { id: true, status: true } },
      initiative: { select: { name: true } },
      requirements: { select: { regime: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const withRegimeSummary = features.map(({ requirements, ...feature }) => ({
    ...feature,
    regimeSummary: computeRegimeSummary(requirements.map((r) => r.regime)),
  }));

  return NextResponse.json(withRegimeSummary);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { initiativeId, name, kanoCategory } = body;

  if (!initiativeId || !name?.trim()) {
    return NextResponse.json(
      { error: "initiativeId and name are required" },
      { status: 400 }
    );
  }

  const feature = await prisma.feature.create({
    data: { initiativeId, name: name.trim(), kanoCategory },
  });
  return NextResponse.json(feature, { status: 201 });
}
