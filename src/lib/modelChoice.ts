export type ModelChoice = "openai" | "claude-opus-5" | "claude-sonnet-5";

// Keep the provider used by Cortex before model selection was introduced as
// the default. Users can still explicitly select OpenAI in the UI.
export const DEFAULT_MODEL_CHOICE: ModelChoice = "claude-sonnet-5";

export function isModelChoice(value: unknown): value is ModelChoice {
  return value === "openai" || value === "claude-opus-5" || value === "claude-sonnet-5";
}
