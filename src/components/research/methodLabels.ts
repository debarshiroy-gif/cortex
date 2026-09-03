export const METHOD_LABEL: Record<string, string> = {
  survey: "Survey / questionnaire",
  jtbd_interview: "JTBD interview",
  ai_moderated_interview: "AI-moderated interview",
  usability_test: "Usability test",
  live_experiment: "Live experiment",
  usage_analytics: "Usage analytics",
  session_replay: "Session replay",
  support_data: "Support data",
  qual_corpus: "Qualitative corpus",
  market_research: "Market research",
  data_analysis: "Data & analytics research",
  secondary_research: "Secondary research",
  fake_door_test: "Fake-door / smoke test",
  ab_test: "A/B test",
};

// The only methods offered at the Initiative strategy-gate stage — usability
// tests, live experiments, etc. need a prototype to exist and belong to the
// later Validation stage. This is a UI-level restriction only: the server and
// the Insight-scoped ExperimentManager flow still accept the full vocabulary.
export const STRATEGY_GATE_METHODS = [
  "survey",
  "data_analysis",
  "secondary_research",
  "fake_door_test",
] as const;

export type StrategyGateMethod = (typeof STRATEGY_GATE_METHODS)[number];

// Validation-stage methods — these test the actual prototype, not the abstract
// idea, so they're only meaningful (and only offered/accepted) once at least
// one PrototypeVersion exists for the initiative.
export const VALIDATION_METHODS = [
  "usability_test",
  "ai_moderated_interview",
  "live_experiment",
  "ab_test",
] as const;

export type ValidationMethod = (typeof VALIDATION_METHODS)[number];

// ab_test needs at least two prototype versions to compare — a stricter bar
// than the other validation methods, which just need one prototype to exist.
export const AB_TEST_MIN_VERSIONS = 2;

export type ExperimentStage = "strategy" | "validation" | "other";

export function getExperimentStage(method: string): ExperimentStage {
  if ((STRATEGY_GATE_METHODS as readonly string[]).includes(method)) return "strategy";
  if ((VALIDATION_METHODS as readonly string[]).includes(method)) return "validation";
  return "other";
}
