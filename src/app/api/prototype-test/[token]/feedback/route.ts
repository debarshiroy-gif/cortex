import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public, unauthenticated: the tester's browser posts here after interacting
// with the assigned prototype. Validates shownVersionId actually belongs to
// this test before recording anything.

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();
  const {
    shownVersionId,
    rating,
    comment,
    customAnswers,
    timeToCompleteMs,
    interactionCount,
    completed,
  } = body as {
    shownVersionId?: string;
    rating?: number;
    comment?: string;
    customAnswers?: { question: string; answer: string }[];
    timeToCompleteMs?: number;
    interactionCount?: number;
    completed?: boolean;
  };

  const experiment = await prisma.experiment.findUnique({ where: { shareToken: token } });
  if (!experiment) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const versionIds = JSON.parse(experiment.abTestVersionIds || "[]") as string[];
  if (!shownVersionId || !versionIds.includes(shownVersionId)) {
    return NextResponse.json(
      { error: "shownVersionId does not belong to this test" },
      { status: 400 }
    );
  }

  await prisma.prototypeFeedback.create({
    data: {
      experimentId: experiment.id,
      shownVersionId,
      rating: rating != null ? Number(rating) : null,
      comment: comment || null,
      customAnswers: JSON.stringify(Array.isArray(customAnswers) ? customAnswers : []),
      timeToCompleteMs: timeToCompleteMs != null ? Number(timeToCompleteMs) : null,
      interactionCount: interactionCount != null ? Number(interactionCount) : 0,
      completed: Boolean(completed),
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
