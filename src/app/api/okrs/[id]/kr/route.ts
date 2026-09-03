import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type KeyResult = {
  id: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  analysisFlag?: string | null;
  analysisSuggestion?: string | null;
};

// PATCH /api/okrs/[id]/kr — update the `current` value of one KR by its id
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { krId, current } = body as { krId: string; current: number };

  if (!krId || current == null) {
    return NextResponse.json(
      { error: "krId and current are required" },
      { status: 400 }
    );
  }

  const okr = await prisma.oKR.findUnique({ where: { id } });
  if (!okr) {
    return NextResponse.json({ error: "OKR not found" }, { status: 404 });
  }

  const krs = JSON.parse(okr.keyResults) as KeyResult[];
  const updated = krs.map((kr) =>
    kr.id === krId ? { ...kr, current } : kr
  );

  const saved = await prisma.oKR.update({
    where: { id },
    data: { keyResults: JSON.stringify(updated) },
  });

  return NextResponse.json(saved);
}
