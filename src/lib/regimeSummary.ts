export interface RegimeSummary {
  regulatedCount: number;
  nonRegulatedCount: number;
  total: number;
  label: string;
}

export function computeRegimeSummary(regimes: string[]): RegimeSummary {
  const regulatedCount = regimes.filter((r) => r === "regulated").length;
  const nonRegulatedCount = regimes.length - regulatedCount;
  const total = regimes.length;

  let label: string;
  if (total === 0) {
    label = "No requirements yet";
  } else if (regulatedCount === 0) {
    label = `${nonRegulatedCount} non-regulated`;
  } else if (nonRegulatedCount === 0) {
    label = `${regulatedCount} regulated`;
  } else {
    label = `${regulatedCount} regulated · ${nonRegulatedCount} non-regulated`;
  }

  return { regulatedCount, nonRegulatedCount, total, label };
}
