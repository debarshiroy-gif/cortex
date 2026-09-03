import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const quarter = searchParams.get("quarter");

  const okrs = await prisma.oKR.findMany({
    where: {
      ...(productId ? { productId } : {}),
      ...(quarter ? { quarter } : {}),
    },
    include: {
      initiatives: {
        include: {
          initiative: { select: { id: true, name: true, status: true } },
        },
      },
    },
    orderBy: [{ quarter: "desc" }, { objective: "asc" }],
  });
  return NextResponse.json(okrs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { productId, objective, quarter, keyResults } = body;

  if (!productId || !objective?.trim() || !quarter?.trim()) {
    return NextResponse.json(
      { error: "productId, objective, and quarter are required" },
      { status: 400 }
    );
  }

  const okr = await prisma.oKR.create({
    data: {
      productId,
      objective: objective.trim(),
      quarter: quarter.trim(),
      keyResults: JSON.stringify(keyResults ?? []),
    },
    include: { initiatives: true },
  });
  return NextResponse.json(okr, { status: 201 });
}
