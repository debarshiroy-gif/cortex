export interface ProposedExperiment {
  method: string;
  hypothesis: string;
  successMetric: string;
  rationale: string;
}

interface ExtractedReply {
  prose: string;
  proposals: ProposedExperiment[];
}

// AI's reply in the research-planning thread is conversational prose with an
// *optional* trailing fenced JSON block — only present when it has concrete,
// nameable experiments to propose, not on every turn (e.g. a clarifying question).
export function extractProposedExperiments(raw: string): ExtractedReply {
  const match = raw.match(/```json\s*([\s\S]*?)```/);
  if (!match || match.index === undefined) {
    return { prose: raw.trim(), proposals: [] };
  }

  const prose = (raw.slice(0, match.index) + raw.slice(match.index + match[0].length)).trim();

  try {
    const parsed = JSON.parse(match[1].trim());
    const proposals = Array.isArray(parsed?.proposedExperiments)
      ? (parsed.proposedExperiments as ProposedExperiment[])
      : [];
    return { prose, proposals };
  } catch {
    return { prose, proposals: [] };
  }
}
