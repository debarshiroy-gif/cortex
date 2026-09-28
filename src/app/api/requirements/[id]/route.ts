import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/lib/auditTrail";
import { formatExperimentCitation } from "@/lib/experimentCitation";

const REGIMES = ["regulated", "non_regulated"] as const;
const GATE_STATUSES = ["draft", "verify", "release"] as const;

type GateStatus = (typeof GATE_STATUSES)[number];
const GATE_ORDER: GateStatus[] = ["draft", "verify", "release"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const requirement = await prisma.requirement.findUnique({ where: { id } });

  if (!requirement) {
    return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
  }

  return NextResponse.json(requirement);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.requirement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
  }

  if (body.regime && !REGIMES.includes(body.regime)) {
    return NextResponse.json(
      { error: `regime must be one of: ${REGIMES.join(", ")}` },
      { status: 400 }
    );
  }

  if (body.gateStatus && !GATE_STATUSES.includes(body.gateStatus)) {
    return NextResponse.json(
      { error: `gateStatus must be one of: ${GATE_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  // A linked Experiment is structured provenance: derive the citation text from
  // its method/sample size/effect size rather than trusting free-text input.
  let resolvedSourceExperimentId: string | null | undefined;
  let resolvedSourceProvenance: string | null | undefined;
  if (body.sourceExperimentId !== undefined) {
    if (body.sourceExperimentId) {
      const experiment = await prisma.experiment.findUnique({
        where: { id: body.sourceExperimentId },
      });
      if (!experiment) {
        return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
      }
      resolvedSourceExperimentId = body.sourceExperimentId;
      resolvedSourceProvenance = formatExperimentCitation(experiment);
    } else {
      resolvedSourceExperimentId = null;
      resolvedSourceProvenance =
        body.sourceProvenance !== undefined ? body.sourceProvenance : null;
    }
  } else if (body.sourceProvenance !== undefined) {
    resolvedSourceProvenance = body.sourceProvenance;
  }

  // Hard rule: a regulated requirement cannot advance past "draft" gate_status
  // without source_provenance filled in.
  const nextRegime = body.regime ?? existing.regime;
  const nextGateStatus = body.gateStatus ?? existing.gateStatus;
  const nextSourceProvenance =
    resolvedSourceProvenance !== undefined
      ? resolvedSourceProvenance
      : existing.sourceProvenance;

  if (
    nextRegime === "regulated" &&
    nextGateStatus !== "draft" &&
    !nextSourceProvenance?.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "Regulated requirements cannot advance past 'draft' without source_provenance.",
      },
      { status: 422 }
    );
  }

  // Hard rule: advancing to "release" requires a human sign-off — an explicit
  // approval flag plus a signer name and date. AI never signs off on a human's
  // behalf (see the Verify gate's "Human owns" column).
  const nextSignOffApproved =
    body.signOffApproved !== undefined
      ? body.signOffApproved
      : existing.signOffApproved;
  const nextSignOffBy =
    body.signOffBy !== undefined ? body.signOffBy : existing.signOffBy;
  const nextSignOffDate =
    body.signOffDate !== undefined ? body.signOffDate : existing.signOffDate;

  if (
    nextGateStatus === "release" &&
    (!nextSignOffApproved || !nextSignOffBy?.trim() || !nextSignOffDate)
  ) {
    return NextResponse.json(
      {
        error:
          "Advancing to 'release' requires a human sign-off: signOffApproved=true, signOffBy, and signOffDate.",
      },
      { status: 422 }
    );
  }

  const requirement = await prisma.requirement.update({
    where: { id },
    data: {
      ...(body.regime !== undefined && { regime: body.regime }),
      ...(body.requirementText !== undefined && {
        requirementText: body.requirementText.trim(),
      }),
      ...(resolvedSourceProvenance !== undefined && {
        sourceProvenance: resolvedSourceProvenance || null,
      }),
      ...(resolvedSourceExperimentId !== undefined && {
        sourceExperimentId: resolvedSourceExperimentId,
      }),
      ...(body.ownerName !== undefined && { ownerName: body.ownerName || null }),
      ...(body.signOffApproved !== undefined && {
        signOffApproved: body.signOffApproved,
      }),
      ...(body.signOffBy !== undefined && { signOffBy: body.signOffBy || null }),
      ...(body.signOffDate !== undefined && {
        signOffDate: body.signOffDate ? new Date(body.signOffDate) : null,
      }),
      ...(body.acceptanceCriteria !== undefined && {
        acceptanceCriteria: JSON.stringify(body.acceptanceCriteria),
      }),
      ...(body.edgeCases !== undefined && {
        edgeCases: JSON.stringify(body.edgeCases),
      }),
      ...(body.riskIfWrong !== undefined && {
        riskIfWrong: body.riskIfWrong || null,
      }),
      ...(body.draftedBy !== undefined && { draftedBy: body.draftedBy }),
      ...(body.verifiedByName !== undefined && {
        verifiedByName: body.verifiedByName || null,
      }),
      ...(body.verifiedByDate !== undefined && {
        verifiedByDate: body.verifiedByDate ? new Date(body.verifiedByDate) : null,
      }),
      ...(body.gateStatus !== undefined && { gateStatus: body.gateStatus }),
      ...(body.linkedInsightId !== undefined && {
        linkedInsightId: body.linkedInsightId || null,
      }),
      ...(body.linkedPrototypeArea !== undefined && {
        linkedPrototypeArea: body.linkedPrototypeArea || null,
      }),
    },
  });

  // Every gate transition is logged, not just written over the status field.
  if (body.gateStatus !== undefined && body.gateStatus !== existing.gateStatus) {
    const fromIndex = GATE_ORDER.indexOf(existing.gateStatus as GateStatus);
    const toIndex = GATE_ORDER.indexOf(body.gateStatus as GateStatus);
    const isForward = toIndex > fromIndex;
    const actorName: string = body.actorName || existing.ownerName || "human";

    if (isForward && body.gateStatus === "release") {
      await recordAuditEvent({
        requirementId: id,
        actor: nextSignOffBy,
        action: "signed_off",
        note:
          body.note ??
          `Signed off and released (${existing.gateStatus} → ${body.gateStatus})`,
      });
    } else if (isForward) {
      await recordAuditEvent({
        requirementId: id,
        actor: actorName,
        action: "verified",
        note: body.note ?? `Advanced ${existing.gateStatus} → ${body.gateStatus}`,
      });
    } else {
      await recordAuditEvent({
        requirementId: id,
        actor: actorName,
        action: "flagged",
        note: body.note ?? `Reverted ${existing.gateStatus} → ${body.gateStatus}`,
      });
    }
  }

  return NextResponse.json(requirement);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.requirement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
  }

  await prisma.requirement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
