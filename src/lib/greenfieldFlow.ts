export type FlowStepKey = "research" | "meetingNotes" | "brd" | "prototype" | "prd";
export type FlowStepState = "done" | "skipped" | "current" | "upcoming" | "blocked";
export type ProjectFlowType = "greenfield" | "regulated_greenfield" | "brownfield";

export interface FlowStepDef {
  key: FlowStepKey;
  label: string;
}

// The pipeline, in order — shared by both flow types. "research" covers both
// the research thinking-partner thread and the Strategy Gate decision —
// skipping it skips both together, since resolving one without the other
// doesn't make sense. Only which steps are *mandatory* differs by type.
export const GREENFIELD_STEPS: FlowStepDef[] = [
  { key: "research", label: "Research" },
  { key: "meetingNotes", label: "Meeting Notes" },
  { key: "brd", label: "BRD" },
  { key: "prototype", label: "Prototype" },
  { key: "prd", label: "PRD" },
];

const STEP_MANDATORY: Record<ProjectFlowType, Record<FlowStepKey, boolean>> = {
  greenfield: {
    research: false,
    meetingNotes: false,
    brd: false,
    prototype: true,
    prd: true,
  },
  regulated_greenfield: {
    research: false,
    meetingNotes: true,
    brd: true,
    prototype: true,
    prd: true,
  },
  // Brownfield is enhancement work against an existing project (always has a
  // baseline set) — Meeting Notes stays optional, but BRD is mandatory since
  // the whole point is documenting the gap being proposed against the master.
  brownfield: {
    research: false,
    meetingNotes: false,
    brd: true,
    prototype: true,
    prd: true,
  },
};

export function flowStepHref(key: FlowStepKey, initiativeId: string): string {
  switch (key) {
    case "research":
      return `/initiatives/${initiativeId}`;
    case "meetingNotes":
      return `/meeting-notes?initiativeId=${initiativeId}`;
    case "brd":
      return `/brd/${initiativeId}`;
    case "prototype":
      return `/prototype/${initiativeId}`;
    case "prd":
      return `/prd/initiative/${initiativeId}`;
  }
}

export interface FlowInitiativeInput {
  id: string;
  researchGateStatus: string;
  strategyGateDecision: string;
  skippedSteps: string; // JSON string[]
}

export interface FlowStep extends FlowStepDef {
  href: string;
  status: FlowStepState;
  mandatory: boolean;
}

export interface FlowStatusResult {
  steps: FlowStep[];
  currentKey: FlowStepKey | null;
  blocked: boolean;
}

function parseSkipped(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function computeFlowStatus(
  initiative: FlowInitiativeInput,
  projectType: ProjectFlowType,
  hasBrd: boolean,
  meetingNotesCount: number,
  prototypeCount: number,
  hasPrd: boolean
): FlowStatusResult {
  const mandatoryFor = STEP_MANDATORY[projectType] ?? STEP_MANDATORY.greenfield;

  if (initiative.strategyGateDecision === "kill") {
    return {
      steps: GREENFIELD_STEPS.map((step) => ({
        ...step,
        href: flowStepHref(step.key, initiative.id),
        status: "blocked" as const,
        mandatory: mandatoryFor[step.key],
      })),
      currentKey: null,
      blocked: true,
    };
  }

  const skipped = parseSkipped(initiative.skippedSteps);
  const researchPivoting = initiative.strategyGateDecision === "pivot";
  const researchDone =
    !researchPivoting &&
    initiative.researchGateStatus !== "undecided" &&
    initiative.strategyGateDecision === "proceed";

  const rawStatus: Record<FlowStepKey, "done" | "skipped" | "not_done"> = {
    research: researchDone ? "done" : "not_done",
    meetingNotes:
      meetingNotesCount > 0 ? "done" : skipped.includes("meetingNotes") ? "skipped" : "not_done",
    brd: hasBrd ? "done" : skipped.includes("brd") ? "skipped" : "not_done",
    prototype: prototypeCount > 0 ? "done" : "not_done",
    prd: hasPrd ? "done" : "not_done",
  };

  let currentKey: FlowStepKey | null = null;
  for (const step of GREENFIELD_STEPS) {
    if (rawStatus[step.key] === "not_done") {
      currentKey = step.key;
      break;
    }
  }

  const steps: FlowStep[] = GREENFIELD_STEPS.map((step) => {
    const raw = rawStatus[step.key];
    const status: FlowStepState =
      raw === "done" ? "done" : raw === "skipped" ? "skipped" : step.key === currentKey ? "current" : "upcoming";
    return { ...step, href: flowStepHref(step.key, initiative.id), status, mandatory: mandatoryFor[step.key] };
  });

  return { steps, currentKey, blocked: false };
}
