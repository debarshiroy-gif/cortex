import { METHOD_LABEL } from "@/components/research/methodLabels";

interface ExperimentLike {
  method: string;
  sampleSize: number | null;
  effectSize: number | null;
  result: string | null;
  hypothesis: string | null;
}

export function formatExperimentCitation(experiment: ExperimentLike): string {
  const label = METHOD_LABEL[experiment.method] ?? experiment.method;
  const stats = [
    experiment.sampleSize != null ? `n=${experiment.sampleSize}` : null,
    experiment.effectSize != null ? `effect size ${experiment.effectSize}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const summary = experiment.result || experiment.hypothesis || "";

  return [`${label}${stats ? ` (${stats})` : ""}`, summary]
    .filter(Boolean)
    .join(": ");
}
