export type ResearchGateStatus = "undecided" | "needed" | "not_needed";
export type ExperimentStatus = "planned" | "running" | "completed";
export type StrategyGateDecision = "pending" | "proceed" | "pivot" | "kill";

export interface ProposedExperiment {
  method: string;
  hypothesis: string;
  successMetric: string;
  rationale: string;
}

export interface ResearchMessage {
  id: string;
  initiativeId: string;
  role: "pm" | "ai";
  content: string;
  proposedExperiments: string; // JSON ProposedExperiment[]
  createdAt: string;
}

export interface ResearchExperiment {
  id: string;
  insightId: string | null;
  initiativeId: string | null;
  method: string;
  hypothesis: string | null;
  successMetric: string | null;
  sampleSize: number | null;
  effectSize: number | null;
  result: string | null;
  watchOut: string | null;
  status: ExperimentStatus;
  targetAudience: string | null;
  outreachDraft: string | null;
  sentAt: string | null;
  dataFileName: string | null;
  dataFileContent: string | null;
  sources: string; // JSON string {url, title}[]
  abTestVersionIds: string; // JSON string[]
  abTestCustomQuestions: string; // JSON string[]
  shareToken: string | null;
  discussionThread: string; // JSON {role: "pm"|"ai", content: string}[]
  surveyResponses: string | null;
  extendedReport: string | null;
  researchAccepted: boolean;
  researchAcceptedBy: string | null;
  researchAcceptedAt: string | null;
  consideredInBrdAt: string | null;
  createdAt: string;
}

export interface InitiativeResearchSummary {
  id: string;
  name: string;
  status: string;
  researchGateStatus: ResearchGateStatus;
  researchSkipReason: string | null;
  strategyGateDecision: StrategyGateDecision;
  strategyGateNote: string | null;
  strategyGateDecidedBy: string | null;
  strategyGateDecidedAt: string | null;
  strategyGateConsideredInBrdAt: string | null;
  experiments: ResearchExperiment[];
}
