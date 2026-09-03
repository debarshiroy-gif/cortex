export type GateStatus = "draft" | "verify" | "release";

export interface Requirement {
  id: string;
  featureId: string;
  regime: "regulated" | "non_regulated";
  requirementText: string;
  sourceProvenance: string | null;
  sourceExperimentId: string | null;
  ownerName: string | null;
  signOffApproved: boolean;
  signOffBy: string | null;
  signOffDate: string | null;
  acceptanceCriteria: string;
  edgeCases: string;
  riskIfWrong: string | null;
  draftedBy: "ai" | "human";
  verifiedByName: string | null;
  verifiedByDate: string | null;
  gateStatus: GateStatus;
  linkedInsightId: string | null;
  linkedPrototypeArea: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AuditAction = "drafted" | "flagged" | "verified" | "signed_off";

export interface AuditTrailEntry {
  id: string;
  requirementId: string;
  actor: string;
  action: AuditAction;
  timestamp: string;
  note: string | null;
}
