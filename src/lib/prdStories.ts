export interface PrdStory {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  phase?: string;
}

interface ExtractedPrd {
  content: string;
  stories: PrdStory[];
}

// The initiative-scoped PRD reply is markdown (the 8-section document) with a
// trailing fenced JSON block holding the JIRA-ready story breakdown — same
// prose-plus-trailing-JSON technique as extractProposedExperiments.
export function extractPrdStories(raw: string): ExtractedPrd {
  const match = raw.match(/```json\s*([\s\S]*?)```/);
  if (!match || match.index === undefined) {
    return { content: raw.trim(), stories: [] };
  }

  const content = (raw.slice(0, match.index) + raw.slice(match.index + match[0].length)).trim();

  try {
    const parsed = JSON.parse(match[1].trim());
    const stories = Array.isArray(parsed?.stories) ? (parsed.stories as PrdStory[]) : [];
    return { content, stories };
  } catch {
    return { content, stories: [] };
  }
}
