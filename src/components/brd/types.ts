export type SourceTeam =
  | "compliance"
  | "operations"
  | "finance"
  | "business"
  | "risk"
  | "data_science"
  | "product_manager";

export type ChannelType =
  | "email_artifact"
  | "meeting_notes"
  | "formal_brd_doc"
  | "verbal_notes";

export type BrdInputStatus = "suggested" | "approved" | "rejected";

export interface BrdInput {
  id: string;
  initiativeId: string;
  sourceTeam: SourceTeam;
  channelType: ChannelType;
  title: string | null;
  content: string;
  link: string | null;
  fileName: string | null;
  status: BrdInputStatus;
  addedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SOURCE_TEAM_LABEL: Record<SourceTeam, string> = {
  compliance: "Compliance",
  operations: "Operations",
  finance: "Finance",
  business: "Business",
  risk: "Risk",
  data_science: "Data Science",
  product_manager: "Product Manager",
};

export const CHANNEL_TYPE_LABEL: Record<ChannelType, string> = {
  email_artifact: "Email + artifact",
  meeting_notes: "Meeting notes",
  formal_brd_doc: "Formal BRD document",
  verbal_notes: "Verbal / ad-hoc notes",
};
