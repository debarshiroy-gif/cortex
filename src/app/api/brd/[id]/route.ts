import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { content } = body as { content?: string };

  const existing = await prisma.bRD.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "BRD not found" }, { status: 404 });
  }

  const brd = await prisma.bRD.update({
    where: { id },
    data: { ...(content !== undefined && { content }) },
  });

  return NextResponse.json(brd);
}
