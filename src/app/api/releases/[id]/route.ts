import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const featureInclude = {
  features: {
    include: {
      feature: {
        select: {
          id: true,
          name: true,
          status: true,
          kanoCategory: true,
          initiative: { select: { name: true } },
          prd: { select: { goals: true, acceptanceCriteria: true } },
        },
      },
    },
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const release = await prisma.release.findUnique({
    where: { id },
    include: featureInclude,
  });
  if (!release) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(release);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, date, tier, checklist } = body;

  const release = await prisma.release.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(date !== undefined && { date: date ? new Date(date) : null }),
      ...(tier !== undefined && { tier }),
      ...(checklist !== undefined && { checklist }),
    },
    include: featureInclude,
  });
  return NextResponse.json(release);
}
