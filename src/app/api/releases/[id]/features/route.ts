import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: releaseId } = await params;
  const { featureId } = await request.json();

  if (!featureId) {
    return NextResponse.json({ error: "featureId required" }, { status: 400 });
  }

  await prisma.releaseFeature.upsert({
    where: { releaseId_featureId: { releaseId, featureId } },
    create: { releaseId, featureId },
    update: {},
  });

  return NextResponse.json({ releaseId, featureId }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: releaseId } = await params;
  const { featureId } = await request.json();

  await prisma.releaseFeature.delete({
    where: { releaseId_featureId: { releaseId, featureId } },
  });

  return NextResponse.json({ ok: true });
}
