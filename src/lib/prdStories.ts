export interface PrdStory {
  title: string;
  // The role this story is written for, e.g. "Operations Manager of Credit Saison" —
  // paired with description's opening "As a <persona>, I want to..." sentence.
  persona: string;
  // Context this story assumes, grounded in a specific cited section of the PRD content
  // above (the document that becomes this story's Epic) — omit if none.
  background?: string;
  // Exact titles of other stories in this same breakdown, listed earlier in the array,
  // that this story depends on or follows in sequence — omit if none.
  linkedStoryTitles?: string[];
  description: string;
  // Business rules, validation, or transformation logic this story implements — omit if none.
  logic?: string;
  // Data mapping between systems/columns (source -> destination) — omit if none.
  mapping?: string;
  // Which UI screen(s), and which part of the screen, this story covers — omit if none.
  uiScreens?: string;
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
