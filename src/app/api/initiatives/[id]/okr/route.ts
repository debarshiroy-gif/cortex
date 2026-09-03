import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST — link an initiative to an OKR
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: initiativeId } = await params;
  const body = await request.json();
  const { okrId } = body;

  if (!okrId) {
    return NextResponse.json({ error: "okrId is required" }, { status: 400 });
  }

  const link = await prisma.oKRInitiative.upsert({
    where: { initiativeId_okrId: { initiativeId, okrId } },
    update: {},
    create: { initiativeId, okrId },
  });
  return NextResponse.json(link, { status: 201 });
}

// DELETE — unlink an initiative from an OKR
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: initiativeId } = await params;
  const { searchParams } = new URL(request.url);
  const okrId = searchParams.get("okrId");

  if (!okrId) {
    return NextResponse.json({ error: "okrId is required" }, { status: 400 });
  }

  await prisma.oKRInitiative.delete({
    where: { initiativeId_okrId: { initiativeId, okrId } },
  });
  return NextResponse.json({ ok: true });
}

// GET — list OKRs linked to this initiative
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: initiativeId } = await params;

  const links = await prisma.oKRInitiative.findMany({
    where: { initiativeId },
    include: { okr: true },
  });
  return NextResponse.json(links.map((l) => l.okr));
}
