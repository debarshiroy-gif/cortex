import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const prd = await prisma.pRD.findUnique({
    where: { id },
    include: {
      feature: {
        include: {
          initiative: { include: { product: true } },
          requirements: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!prd) {
    return NextResponse.json({ error: "PRD not found" }, { status: 404 });
  }

  return NextResponse.json(prd);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { content, stories, status } = body as {
    content?: string;
    stories?: unknown;
    status?: string;
  };

  const existing = await prisma.pRD.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "PRD not found" }, { status: 404 });
  }

  const prd = await prisma.pRD.update({
    where: { id },
    data: {
      ...(content !== undefined && { content }),
      ...(stories !== undefined && { stories: JSON.stringify(stories) }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json(prd);
}
