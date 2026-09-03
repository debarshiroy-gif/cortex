import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  const products = await prisma.product.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    include: { personas: true, _count: { select: { initiatives: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { workspaceId, name, description } = body;

  if (!workspaceId || !name?.trim()) {
    return NextResponse.json(
      { error: "workspaceId and name are required" },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: { workspaceId, name: name.trim(), description },
  });
  return NextResponse.json(product, { status: 201 });
}
