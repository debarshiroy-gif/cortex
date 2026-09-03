export type PrototypeKind = "ui" | "backend";
export type PrototypeSourceMode = "brd" | "experiments" | "prompt";

export interface PrototypeVersion {
  id: string;
  initiativeId: string;
  versionNumber: number;
  kind: PrototypeKind;
  sourceMode: PrototypeSourceMode;
  promptText: string | null;
  content: string;
  readabilityScore: number | null;
  createdAt: string;
}

export const SOURCE_MODE_LABEL: Record<PrototypeSourceMode, string> = {
  brd: "From BRD",
  experiments: "From Experiments",
  prompt: "From Prompt",
};
