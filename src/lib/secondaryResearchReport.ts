export type FindingStance = "supports" | "negates" | "mixed";

export interface KeyFinding {
  stance: FindingStance;
  text: string;
}

const EXTENDED_REPORT_HEADING = /^#{1,3}\s*extended report\s*$/im;
const KEY_FINDINGS_HEADING = /^#{1,3}\s*key findings\s*$/im;
// Tolerates the model wrapping the tag in markdown emphasis (**[Supports]**) and
// compound tags it sometimes invents despite instructions (e.g. [Negates/Mixed]).
const STANCE_TAG = /^[*_]{0,3}\[([a-z/]+)\][*_]{0,3}\s*/i;

function toStance(rawTag: string): FindingStance {
  const lower = rawTag.toLowerCase();
  if (lower.includes("negates")) return "negates";
  if (lower.includes("supports")) return "supports";
  return "mixed";
}

// Splits raw model output on the "## Extended Report" heading, and drops anything
// before "## Key Findings" (models sometimes narrate their own process — "Let me
// compile the report" — ahead of the heading; that shouldn't leak into the summary).
// Falls back to treating the whole reply as Key Findings if the model didn't follow
// the two-section format, so a malformed reply still saves usefully instead of throwing.
export function splitSecondaryResearch(raw: string): {
  keyFindings: string;
  extendedReport: string;
} {
  const extendedMatch = raw.match(EXTENDED_REPORT_HEADING);
  const beforeExtended =
    extendedMatch && extendedMatch.index !== undefined
      ? raw.slice(0, extendedMatch.index)
      : raw;
  const extendedReport =
    extendedMatch && extendedMatch.index !== undefined
      ? raw.slice(extendedMatch.index + extendedMatch[0].length).trim()
      : "";

  const keyFindingsMatch = beforeExtended.match(KEY_FINDINGS_HEADING);
  const keyFindings =
    keyFindingsMatch && keyFindingsMatch.index !== undefined
      ? beforeExtended.slice(keyFindingsMatch.index + keyFindingsMatch[0].length).trim()
      : beforeExtended.trim();

  return { keyFindings, extendedReport };
}

// Parses the Key Findings section into tagged bullets for display. Bullets often span
// multiple lines (a quoted source, then a follow-up sentence) with no leading marker on
// the continuation lines, so this groups by bullet-start rather than parsing line by
// line. Defensively caps at 15 even though the prompt already asks for that, and
// defaults untagged bullets to "mixed" rather than dropping them.
export function parseKeyFindings(keyFindings: string): KeyFinding[] {
  const findings: KeyFinding[] = [];

  for (const chunk of keyFindings.split(/\n(?=[-*]\s+)/)) {
    const bulletMatch = chunk.trim().match(/^[-*]\s+([\s\S]*)$/);
    if (!bulletMatch) continue;

    const body = bulletMatch[1].replace(/\s*\n+\s*/g, " ").trim();
    const tagMatch = body.match(STANCE_TAG);
    const stance = tagMatch ? toStance(tagMatch[1]) : "mixed";
    const text = tagMatch ? body.slice(tagMatch[0].length).trim() : body;
    if (text) findings.push({ stance, text });
  }

  return findings.slice(0, 15);
}
