import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { attachInitiativeComputedFields } from "@/lib/initiativeSummary";

const GATE_STATUSES = ["needed", "not_needed"] as const;
const STRATEGY_DECISIONS = ["pending", "proceed", "pivot", "kill"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: {
      features: {
        select: {
          id: true,
          name: true,
          status: true,
          requirements: { select: { regime: true } },
        },
      },
      meetingNotes: { select: { geminiNotetakerEnabled: true } },
      researchMessages: { orderBy: { createdAt: "asc" } },
      experiments: { orderBy: { createdAt: "desc" } },
      baselineInitiative: { select: { id: true, name: true } },
    },
  });

  if (!initiative) {
    return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
  }

  return NextResponse.json(attachInitiativeComputedFields(initiative));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const {
    researchGateStatus,
    researchSkipReason,
    strategyGateDecision,
    strategyGateNote,
    strategyGateDecidedBy,
    skipStep,
    skipResearchAndStrategy,
  } = body as {
    researchGateStatus?: string;
    researchSkipReason?: string;
    strategyGateDecision?: string;
    strategyGateNote?: string;
    strategyGateDecidedBy?: string;
    skipStep?: "meetingNotes" | "brd";
    skipResearchAndStrategy?: boolean;
  };

  if (
    researchGateStatus === undefined &&
    strategyGateDecision === undefined &&
    skipStep === undefined &&
    !skipResearchAndStrategy
  ) {
    return NextResponse.json(
      { error: "researchGateStatus, strategyGateDecision, skipStep, or skipResearchAndStrategy is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.initiative.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (skipStep !== undefined) {
    if (skipStep !== "meetingNotes" && skipStep !== "brd") {
      return NextResponse.json(
        { error: "skipStep must be one of: meetingNotes, brd" },
        { status: 400 }
      );
    }
    let skipped: string[] = [];
    try {
      const parsed = JSON.parse(existing.skippedSteps);
      skipped = Array.isArray(parsed) ? parsed : [];
    } catch {
      skipped = [];
    }
    if (!skipped.includes(skipStep)) skipped.push(skipStep);
    data.skippedSteps = JSON.stringify(skipped);
  }

  if (skipResearchAndStrategy) {
    data.researchGateStatus = "not_needed";
    data.researchSkipReason = "Skipped via guided flow";
    data.strategyGateDecision = "proceed";
    data.strategyGateNote = "Skipped via guided flow";
    data.strategyGateDecidedBy = "Skipped via flow";
    data.strategyGateDecidedAt = new Date();
    data.status = "committed";
  }

  if (researchGateStatus !== undefined) {
    if (!GATE_STATUSES.includes(researchGateStatus as (typeof GATE_STATUSES)[number])) {
      return NextResponse.json(
        { error: `researchGateStatus must be one of: ${GATE_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    if (researchGateStatus === "not_needed" && !researchSkipReason?.trim()) {
      return NextResponse.json(
        { error: "researchSkipReason is required when skipping research" },
        { status: 400 }
      );
    }
    data.researchGateStatus = researchGateStatus;
    data.researchSkipReason = researchGateStatus === "not_needed" ? researchSkipReason!.trim() : null;
  }

  if (strategyGateDecision !== undefined) {
    if (!STRATEGY_DECISIONS.includes(strategyGateDecision as (typeof STRATEGY_DECISIONS)[number])) {
      return NextResponse.json(
        { error: `strategyGateDecision must be one of: ${STRATEGY_DECISIONS.join(", ")}` },
        { status: 400 }
      );
    }
    if (
      strategyGateDecision !== "pending" &&
      (!strategyGateNote?.trim() || !strategyGateDecidedBy?.trim())
    ) {
      return NextResponse.json(
        { error: "strategyGateNote and strategyGateDecidedBy are required to record a decision" },
        { status: 400 }
      );
    }

    data.strategyGateDecision = strategyGateDecision;
    data.strategyGateNote = strategyGateDecision === "pending" ? null : strategyGateNote!.trim();
    data.strategyGateDecidedBy =
      strategyGateDecision === "pending" ? null : strategyGateDecidedBy!.trim();
    data.strategyGateDecidedAt = strategyGateDecision === "pending" ? null : new Date();

    if (strategyGateDecision === "proceed") {
      data.status = "committed";
    } else if (strategyGateDecision === "kill") {
      data.status = "killed";
    } else if (strategyGateDecision === "pending") {
      // "Reconsider": only revert status if this gate is what set it
      if (existing.status === "committed" || existing.status === "killed") {
        data.status = "idea";
      }
    }
    // "pivot" leaves status untouched — still forming, just redirected.
  }

  const initiative = await prisma.initiative.update({ where: { id }, data });

  return NextResponse.json(initiative);
}
