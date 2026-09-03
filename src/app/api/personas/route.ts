import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  const personas = await prisma.persona.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(personas);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { productId, name, description, jobsToBeDone } = body;

  if (!productId || !name?.trim()) {
    return NextResponse.json(
      { error: "productId and name are required" },
      { status: 400 }
    );
  }

  const persona = await prisma.persona.create({
    data: {
      productId,
      name: name.trim(),
      description,
      jobsToBeDone: JSON.stringify(jobsToBeDone ?? []),
    },
  });
  return NextResponse.json(persona, { status: 201 });
}
