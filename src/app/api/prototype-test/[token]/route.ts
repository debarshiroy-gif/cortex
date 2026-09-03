import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { injectTelemetryScript } from "@/lib/prototypeTelemetry";

// Public, unauthenticated: a tester following the share link hits this route
// with no Cortex session. Deliberately returns nothing about the Experiment
// or Initiative beyond the one assigned prototype and its test questions.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const requestedVariant = searchParams.get("variant");

  const experiment = await prisma.experiment.findUnique({ where: { shareToken: token } });
  if (!experiment) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const versionIds = JSON.parse(experiment.abTestVersionIds || "[]") as string[];
  if (versionIds.length === 0) {
    return NextResponse.json({ error: "This test has no versions configured" }, { status: 400 });
  }

  if (requestedVariant && !versionIds.includes(requestedVariant)) {
    return NextResponse.json({ error: "That variant isn't part of this test" }, { status: 400 });
  }

  const versions = await prisma.prototypeVersion.findMany({
    where: { id: { in: versionIds } },
  });
  if (versions.length === 0) {
    return NextResponse.json({ error: "This test has no versions configured" }, { status: 400 });
  }

  // A direct ?variant= link (given out per-version to the PM, or for deliberate
  // split distribution) always shows that version. Otherwise, a real tester
  // following the plain share link gets a genuine random assignment.
  const chosen = requestedVariant
    ? versions.find((v) => v.id === requestedVariant)!
    : versions[Math.floor(Math.random() * versions.length)];
  const customQuestions = JSON.parse(experiment.abTestCustomQuestions || "[]") as string[];

  return NextResponse.json({
    shownVersionId: chosen.id,
    kind: chosen.kind,
    content: chosen.kind === "ui" ? injectTelemetryScript(chosen.content) : chosen.content,
    customQuestions,
  });
}
