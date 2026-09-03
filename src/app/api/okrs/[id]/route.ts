import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const okr = await prisma.oKR.findUnique({
    where: { id },
    include: {
      initiatives: {
        include: {
          initiative: { select: { id: true, name: true, status: true, riceScore: true } },
        },
      },
    },
  });

  if (!okr) {
    return NextResponse.json({ error: "OKR not found" }, { status: 404 });
  }
  return NextResponse.json(okr);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { objective, quarter, keyResults } = body;

  const okr = await prisma.oKR.update({
    where: { id },
    data: {
      ...(objective ? { objective } : {}),
      ...(quarter ? { quarter } : {}),
      ...(keyResults !== undefined
        ? { keyResults: JSON.stringify(keyResults) }
        : {}),
    },
  });
  return NextResponse.json(okr);
}
