import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AB_TEST_MIN_VERSIONS } from "@/components/research/methodLabels";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { versionIds, customQuestions } = body as {
    versionIds?: string[];
    customQuestions?: string[];
  };

  const experiment = await prisma.experiment.findUnique({ where: { id } });
  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (experiment.method !== "ab_test") {
    return NextResponse.json(
      { error: "This experiment's method is not ab_test" },
      { status: 400 }
    );
  }
  if (!experiment.initiativeId) {
    return NextResponse.json(
      { error: "A/B test experiments must belong to an initiative" },
      { status: 400 }
    );
  }
  if (!Array.isArray(versionIds) || versionIds.length < AB_TEST_MIN_VERSIONS) {
    return NextResponse.json(
      { error: `versionIds must include at least ${AB_TEST_MIN_VERSIONS} prototype versions` },
      { status: 400 }
    );
  }

  const versions = await prisma.prototypeVersion.findMany({
    where: { id: { in: versionIds }, initiativeId: experiment.initiativeId },
  });
  if (versions.length !== versionIds.length) {
    return NextResponse.json(
      { error: "One or more versionIds are invalid or don't belong to this initiative" },
      { status: 400 }
    );
  }

  const cleanQuestions = Array.isArray(customQuestions)
    ? customQuestions.map((q) => String(q).trim()).filter(Boolean)
    : [];

  const updated = await prisma.experiment.update({
    where: { id },
    data: {
      abTestVersionIds: JSON.stringify(versionIds),
      abTestCustomQuestions: JSON.stringify(cleanQuestions),
      shareToken: experiment.shareToken ?? randomUUID(),
      status: "running",
    },
  });

  return NextResponse.json(updated);
}
