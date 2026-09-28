"use client";

import type { ModelChoice } from "@/lib/llm";

interface ModelChoiceSelectProps {
  value: ModelChoice;
  onChange: (choice: ModelChoice) => void;
  disabled?: boolean;
}

export function ModelChoiceSelect({ value, onChange, disabled }: ModelChoiceSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ModelChoice)}
      disabled={disabled}
      style={{ fontSize: 12 }}
    >
      <optgroup label="ChatGPT">
        <option value="openai">ChatGPT</option>
      </optgroup>
      <optgroup label="Claude">
        <option value="claude-opus-5">Claude Opus 5</option>
        <option value="claude-sonnet-5">Claude Sonnet 5</option>
      </optgroup>
    </select>
  );
}
