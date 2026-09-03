import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const interviewId = searchParams.get("interviewId");

  const insights = await prisma.insight.findMany({
    where: {
      ...(interviewId ? { interviewId } : {}),
      ...(productId
        ? { interview: { persona: { productId } } }
        : {}),
    },
    include: {
      interview: { include: { persona: { select: { name: true } } } },
    },
    orderBy: { id: "desc" },
  });
  return NextResponse.json(insights);
}

// POST accepts either a single insight or an array (batch save from extraction)
export async function POST(request: Request) {
  const body = await request.json();

  if (Array.isArray(body)) {
    const created = await prisma.$transaction(
      body.map((item) =>
        prisma.insight.create({
          data: {
            interviewId: item.interviewId,
            summary: item.summary,
            tags: JSON.stringify(item.tags ?? []),
            confidence: item.confidence ?? "med",
          },
        })
      )
    );
    return NextResponse.json(created, { status: 201 });
  }

  const { interviewId, summary, tags, confidence } = body;

  if (!interviewId || !summary?.trim()) {
    return NextResponse.json(
      { error: "interviewId and summary are required" },
      { status: 400 }
    );
  }

  const insight = await prisma.insight.create({
    data: {
      interviewId,
      summary: summary.trim(),
      tags: JSON.stringify(tags ?? []),
      confidence: confidence ?? "med",
    },
  });
  return NextResponse.json(insight, { status: 201 });
}
