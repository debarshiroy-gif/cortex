import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const requirement = await prisma.requirement.findUnique({ where: { id } });
  if (!requirement) {
    return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
  }

  const entries = await prisma.auditTrail.findMany({
    where: { requirementId: id },
    orderBy: { timestamp: "asc" },
  });

  return NextResponse.json(entries);
}
