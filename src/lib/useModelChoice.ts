"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_MODEL_CHOICE, isModelChoice, type ModelChoice } from "@/lib/modelChoice";

const STORAGE_KEY = "cortex:model-choice";

export function useModelChoice(): [ModelChoice, (choice: ModelChoice) => void] {
  const [modelChoice, setModelChoiceState] = useState<ModelChoice>(DEFAULT_MODEL_CHOICE);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isModelChoice(stored)) setModelChoiceState(stored);
  }, []);

  const setModelChoice = useCallback((choice: ModelChoice) => {
    setModelChoiceState(choice);
    localStorage.setItem(STORAGE_KEY, choice);
  }, []);

  return [modelChoice, setModelChoice];
}
