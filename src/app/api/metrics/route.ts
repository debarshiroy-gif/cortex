import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  const metrics = await prisma.metric.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(metrics);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { productId, name, type, currentValue, targetValue, unit } = body;

  if (!productId || !name?.trim()) {
    return NextResponse.json(
      { error: "productId and name are required" },
      { status: 400 }
    );
  }

  const metric = await prisma.metric.create({
    data: {
      productId,
      name: name.trim(),
      type: type ?? "input",
      currentValue,
      targetValue,
      unit,
    },
  });
  return NextResponse.json(metric, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, currentValue, targetValue } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const metric = await prisma.metric.update({
    where: { id },
    data: { currentValue, targetValue },
  });
  return NextResponse.json(metric);
}
