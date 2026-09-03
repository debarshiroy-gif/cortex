import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  const releases = await prisma.release.findMany({
    where: productId ? { productId } : undefined,
    include: {
      features: {
        include: {
          feature: {
            select: {
              id: true,
              name: true,
              status: true,
              kanoCategory: true,
              initiative: { select: { name: true } },
              prd: { select: { goals: true, acceptanceCriteria: true } },
            },
          },
        },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(releases);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { productId, name, date, tier } = body;

  if (!productId || !name?.trim()) {
    return NextResponse.json(
      { error: "productId and name are required" },
      { status: 400 }
    );
  }

  const release = await prisma.release.create({
    data: {
      productId,
      name: name.trim(),
      date: date ? new Date(date) : undefined,
      tier: tier ?? "minor",
    },
    include: { features: true },
  });
  return NextResponse.json(release, { status: 201 });
}
