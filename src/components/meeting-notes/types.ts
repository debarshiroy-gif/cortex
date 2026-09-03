export type SourceType = "gemini_notes" | "slack_thread" | "freetext";
export type MeetingNoteStatus = "suggested" | "approved" | "rejected";
export type NotetakerEnabled = "yes" | "no" | "not_applicable";

export interface MeetingNote {
  id: string;
  sourceType: SourceType;
  link: string | null;
  rawContent: string;
  meetingDate: string | null;
  attendees: string; // JSON string[]
  relevanceScore: number | null;
  status: MeetingNoteStatus;
  linkedInitiativeId: string | null;
  linkedInsightId: string | null;
  geminiNotetakerEnabled: NotetakerEnabled | null;
  addedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InitiativeOption {
  id: string;
  name: string;
}
