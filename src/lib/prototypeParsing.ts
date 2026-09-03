export interface ParsedPrototype {
  kind: "ui" | "backend";
  content: string;
}

// Deliberately not JSON — the payload is often a multi-KB HTML document full of quotes
// and backticks, which JSON-escaping handles unreliably. Format is:
//   KIND: ui
//   ---
//   ...content, verbatim, to the end...
export function parsePrototypeReply(raw: string): ParsedPrototype {
  const lines = raw.split("\n");
  const kindLineIndex = lines.findIndex((l) => /^KIND:\s*(ui|backend)/i.test(l.trim()));
  if (kindLineIndex === -1) {
    throw new Error("Could not find a KIND: line in the model's reply");
  }

  const kindMatch = /^KIND:\s*(ui|backend)/i.exec(lines[kindLineIndex].trim());
  const kind = kindMatch![1].toLowerCase() as "ui" | "backend";

  const separatorIndex = lines.findIndex(
    (l, i) => i > kindLineIndex && l.trim() === "---"
  );
  if (separatorIndex === -1) {
    throw new Error("Could not find the --- separator in the model's reply");
  }

  const content = lines
    .slice(separatorIndex + 1)
    .join("\n")
    .trim()
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  if (!content) {
    throw new Error("Model's reply had no content after the separator");
  }

  return { kind, content };
}
