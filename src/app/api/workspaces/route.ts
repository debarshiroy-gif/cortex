import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const workspaces = await prisma.workspace.findMany({
    include: { products: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(workspaces);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const workspace = await prisma.workspace.create({
    data: { name: name.trim() },
  });
  return NextResponse.json(workspace, { status: 201 });
}
