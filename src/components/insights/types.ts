export const EXPERIMENT_METHODS = [
  "survey",
  "jtbd_interview",
  "ai_moderated_interview",
  "usability_test",
  "live_experiment",
  "usage_analytics",
  "session_replay",
  "support_data",
  "qual_corpus",
  "market_research",
] as const;

export type ExperimentMethod = (typeof EXPERIMENT_METHODS)[number];

export interface Experiment {
  id: string;
  insightId: string;
  method: ExperimentMethod;
  hypothesis: string | null;
  successMetric: string | null;
  sampleSize: number | null;
  effectSize: number | null;
  result: string | null;
  watchOut: string | null;
  createdAt: string;
}

export interface FeatureOption {
  id: string;
  name: string;
  initiative: { name: string };
}
