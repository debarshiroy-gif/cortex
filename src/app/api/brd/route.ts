import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const initiativeId = searchParams.get("initiativeId");

  if (!initiativeId) {
    return NextResponse.json({ error: "initiativeId is required" }, { status: 400 });
  }

  const brd = await prisma.bRD.findUnique({ where: { initiativeId } });
  return NextResponse.json(brd);
}
