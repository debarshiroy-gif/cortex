import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STATUSES = ["planned", "running", "completed"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const experiment = await prisma.experiment.findUnique({ where: { id } });
  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  return NextResponse.json(experiment);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.experiment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const experiment = await prisma.experiment.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.result !== undefined && { result: body.result || null }),
      ...(body.watchOut !== undefined && { watchOut: body.watchOut || null }),
      ...(body.hypothesis !== undefined && { hypothesis: body.hypothesis || null }),
      ...(body.successMetric !== undefined && { successMetric: body.successMetric || null }),
      ...(body.sampleSize !== undefined && {
        sampleSize: body.sampleSize != null ? Number(body.sampleSize) : null,
      }),
      ...(body.effectSize !== undefined && {
        effectSize: body.effectSize != null ? Number(body.effectSize) : null,
      }),
      ...(body.targetAudience !== undefined && { targetAudience: body.targetAudience || null }),
      ...(body.outreachDraft !== undefined && { outreachDraft: body.outreachDraft || null }),
      ...(body.sentAt !== undefined && {
        sentAt: body.sentAt ? new Date(body.sentAt) : null,
      }),
    },
  });

  return NextResponse.json(experiment);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.experiment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  await prisma.experiment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
