import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { accepted, acceptedBy } = body as { accepted?: boolean; acceptedBy?: string };

  const experiment = await prisma.experiment.findUnique({ where: { id } });
  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (experiment.method !== "secondary_research") {
    return NextResponse.json(
      { error: "This experiment's method is not secondary_research" },
      { status: 400 }
    );
  }

  if (accepted) {
    if (!experiment.result) {
      return NextResponse.json({ error: "There's no research to accept yet" }, { status: 400 });
    }
    if (!acceptedBy?.trim()) {
      return NextResponse.json({ error: "Your name is required to accept" }, { status: 400 });
    }
  }

  const updated = await prisma.experiment.update({
    where: { id },
    data: accepted
      ? {
          researchAccepted: true,
          researchAcceptedBy: acceptedBy!.trim(),
          researchAcceptedAt: new Date(),
        }
      : {
          researchAccepted: false,
          researchAcceptedBy: null,
          researchAcceptedAt: null,
        },
  });

  return NextResponse.json(updated);
}
