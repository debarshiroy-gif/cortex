import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = "claude-sonnet-4-6";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChat(
  systemPrompt: string,
  messages: ChatMessage[],
  maxTokens = 4096
): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}

export async function streamText(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096
): Promise<string> {
  return streamChat(systemPrompt, [{ role: "user", content: userMessage }], maxTokens);
}

export interface ResearchSource {
  url: string;
  title: string;
}

// Secondary research: gives Claude Anthropic's server-side web search tool
// alongside its own knowledge. The installed SDK's types predate this tool,
// and the response can contain interleaved text / server_tool_use /
// web_search_tool_result blocks (not the single text block streamChat
// assumes), so this parses defensively rather than relying on narrow types.
export async function streamResearch(
  systemPrompt: string,
  userMessage: string
): Promise<{ text: string; sources: ResearchSource[] }> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }] as never,
  });

  const blocks = message.content as unknown as Array<{
    type: string;
    text?: string;
    citations?: { url?: string; title?: string }[];
  }>;

  const text = blocks
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n\n")
    .trim();

  const sources = new Map<string, ResearchSource>();
  for (const block of blocks) {
    if (block.type === "text" && block.citations) {
      for (const c of block.citations) {
        if (c.url) sources.set(c.url, { url: c.url, title: c.title ?? c.url });
      }
    }
  }

  return { text, sources: Array.from(sources.values()) };
}
