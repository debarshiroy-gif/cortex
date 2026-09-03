import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PRODUCT_ID = "seed-product";

export async function GET() {
  const updates = await prisma.stakeholderUpdate.findMany({
    where: { productId: PRODUCT_ID },
    include: { release: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(updates);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { period, summary, wins, risks, asks, metricsSnapshot, releaseId } =
    body;

  if (!period?.trim()) {
    return NextResponse.json({ error: "period is required" }, { status: 400 });
  }

  const update = await prisma.stakeholderUpdate.create({
    data: {
      productId: PRODUCT_ID,
      period: period.trim(),
      summary: summary ?? null,
      wins: wins ? JSON.stringify(wins) : "[]",
      risks: risks ? JSON.stringify(risks) : "[]",
      asks: asks ? JSON.stringify(asks) : "[]",
      metricsSnapshot: metricsSnapshot ? JSON.stringify(metricsSnapshot) : "{}",
      releaseId: releaseId ?? null,
    },
    include: { release: { select: { name: true } } },
  });

  return NextResponse.json(update, { status: 201 });
}
