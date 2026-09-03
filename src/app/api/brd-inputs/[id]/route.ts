import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STATUSES = ["suggested", "approved", "rejected"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const input = await prisma.brdInput.findUnique({ where: { id } });
  if (!input) {
    return NextResponse.json({ error: "BrdInput not found" }, { status: 404 });
  }
  return NextResponse.json(input);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.brdInput.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "BrdInput not found" }, { status: 404 });
  }

  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const input = await prisma.brdInput.update({
    where: { id },
    data: {
      ...(body.content !== undefined && { content: body.content }),
      ...(body.title !== undefined && { title: body.title || null }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });

  return NextResponse.json(input);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.brdInput.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "BrdInput not found" }, { status: 404 });
  }
  await prisma.brdInput.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
