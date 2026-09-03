"use client";

import { useCallback, useEffect, useState } from "react";
import {
  computeFlowStatus,
  type FlowStatusResult,
  type FlowInitiativeInput,
  type ProjectFlowType,
} from "@/lib/greenfieldFlow";

// Shared by every page in the greenfield/regulated-greenfield pipeline so the
// step bar and skip/continue footer always agree, regardless of which page
// loaded them. Fetches its own snapshot of initiative + BRD + meeting notes +
// prototype + PRD status via the existing endpoints each of those pages
// already have — a page that already fetched one of these for its own
// purposes still calls this hook for a consistent, single source of truth.
export function useGreenfieldFlow(initiativeId: string | undefined) {
  const [flow, setFlow] = useState<FlowStatusResult | null>(null);
  const [isExternalBaseline, setIsExternalBaseline] = useState(false);

  const refresh = useCallback(() => {
    if (!initiativeId) return;
    Promise.all([
      fetch(`/api/initiatives/${initiativeId}`).then((r) => r.json()),
      fetch(`/api/brd?initiativeId=${initiativeId}`).then((r) => r.json()),
      fetch(`/api/meeting-notes?linkedInitiativeId=${initiativeId}`).then((r) => r.json()),
      fetch(`/api/prototype-versions?initiativeId=${initiativeId}`).then((r) => r.json()),
      fetch(`/api/prd?initiativeId=${initiativeId}`).then((r) => r.json()),
    ]).then(([initiative, brd, notes, versions, prd]) => {
      // external_baseline is a system-created placeholder that never runs its
      // own pipeline — everything else (including brownfield now) gets a real
      // computed flow.
      if (initiative?.projectType === "external_baseline") {
        setIsExternalBaseline(true);
        setFlow(null);
        return;
      }
      setIsExternalBaseline(false);
      const input: FlowInitiativeInput = {
        id: initiativeId,
        researchGateStatus: initiative.researchGateStatus,
        strategyGateDecision: initiative.strategyGateDecision,
        skippedSteps: initiative.skippedSteps ?? "[]",
      };
      const projectType: ProjectFlowType =
        initiative.projectType === "regulated_greenfield" || initiative.projectType === "brownfield"
          ? initiative.projectType
          : "greenfield";
      setFlow(
        computeFlowStatus(
          input,
          projectType,
          !!brd?.content,
          Array.isArray(notes) ? notes.length : 0,
          Array.isArray(versions) ? versions.length : 0,
          !!prd?.content
        )
      );
    });
  }, [initiativeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { flow, isExternalBaseline, refresh };
}
