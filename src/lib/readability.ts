// Flesch Reading Ease, computed once per UI prototype from its own visible
// text — a static property of what got built, not of any tester's session.
// Syllable counting uses a standard vowel-group heuristic (approximate, as
// all lightweight readability implementations are).

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countSyllables(word: string): number {
  const lower = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!lower) return 0;
  const groups = lower.match(/[aeiouy]+/g) ?? [];
  let count = groups.length;
  if (lower.endsWith("e") && count > 1) count -= 1;
  return Math.max(count, 1);
}

export function computeReadability(html: string): number | null {
  const text = stripHtml(html);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));

  if (sentences.length === 0 || words.length === 0) return null;

  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const score =
    206.835 -
    1.015 * (words.length / sentences.length) -
    84.6 * (syllables / words.length);

  return Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
}

export function readabilityBand(score: number): string {
  if (score >= 90) return "very easy";
  if (score >= 70) return "easy";
  if (score >= 60) return "fairly easy";
  if (score >= 50) return "standard";
  if (score >= 30) return "fairly difficult";
  return "difficult";
}
