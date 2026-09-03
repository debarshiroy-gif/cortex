import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const personaId = searchParams.get("personaId");
  const productId = searchParams.get("productId");

  const interviews = await prisma.interview.findMany({
    where: {
      ...(personaId ? { personaId } : {}),
      ...(productId ? { persona: { productId } } : {}),
    },
    include: {
      persona: { select: { id: true, name: true } },
      insights: true,
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(interviews);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { personaId, notes, transcriptRef } = body;

  if (!personaId || !notes?.trim()) {
    return NextResponse.json(
      { error: "personaId and notes are required" },
      { status: 400 }
    );
  }

  const interview = await prisma.interview.create({
    data: { personaId, notes: notes.trim(), transcriptRef },
    include: { persona: { select: { id: true, name: true } }, insights: true },
  });
  return NextResponse.json(interview, { status: 201 });
}
