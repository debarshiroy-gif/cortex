import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODEL_CHOICE, type ModelChoice } from "@/lib/modelChoice";

export { DEFAULT_MODEL_CHOICE, isModelChoice, type ModelChoice } from "@/lib/modelChoice";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = "gpt-5.6-sol";

export function llmErrorMessage(error: unknown, modelChoice: ModelChoice): string {
  const provider = modelChoice === "openai" ? "OpenAI" : "Anthropic";
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? (error as { status?: unknown }).status
      : undefined;

  if (status === 401) {
    const variable = modelChoice === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
    const source =
      modelChoice === "openai" ? "platform.openai.com/api-keys" : "console.anthropic.com";
    return `${provider} authentication failed. Set ${variable} to an API key from ${source}, then restart Cortex.`;
  }
  if (status === 403) {
    return `${provider} denied access to the selected model. Check the API key's model permissions.`;
  }
  if (status === 429) {
    return `${provider} rate limit or quota exceeded. Check the account's usage and billing, then retry.`;
  }

  return `${provider} could not complete the model request. Please retry or select another model.`;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChat(
  systemPrompt: string,
  messages: ChatMessage[],
  maxTokens = 4096,
  modelChoice: ModelChoice = DEFAULT_MODEL_CHOICE
): Promise<string> {
  if (modelChoice !== "openai") {
    const response = await anthropic.messages.create({
      model: modelChoice,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
    } as never);

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  }

  const response = await openai.responses.create({
    model: MODEL,
    instructions: systemPrompt,
    input: messages.map((m) => ({ role: m.role, content: m.content })),
    max_output_tokens: maxTokens,
    reasoning: { effort: "medium" },
  });

  if (!response.output_text) throw new Error("Unexpected response type");
  return response.output_text;
}

export async function streamText(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096,
  modelChoice: ModelChoice = DEFAULT_MODEL_CHOICE
): Promise<string> {
  return streamChat(systemPrompt, [{ role: "user", content: userMessage }], maxTokens, modelChoice);
}

export interface ResearchSource {
  url: string;
  title: string;
}

// Secondary research: gives the model server-side web search alongside its
// own knowledge. OpenAI returns sources as `url_citation` annotations on
// output_text content blocks (not a separate sources array), so that branch
// walks the response output defensively rather than relying on narrow types
// (the installed SDK's types can lag new Responses API shapes). The Claude
// branch reads `web_search_tool_result` blocks instead.
export async function streamResearch(
  systemPrompt: string,
  userMessage: string,
  modelChoice: ModelChoice = DEFAULT_MODEL_CHOICE
): Promise<{ text: string; sources: ResearchSource[] }> {
  if (modelChoice !== "openai") {
    const response = await anthropic.messages.create({
      model: modelChoice,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      tools: [{ type: "web_search_20260209", name: "web_search" }],
    } as never);

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const sources = new Map<string, ResearchSource>();
    const items = response.content as unknown as Array<{
      type: string;
      content?: Array<{ url?: string; title?: string }>;
    }>;
    for (const item of items) {
      if (item.type !== "web_search_tool_result" || !Array.isArray(item.content)) continue;
      for (const result of item.content) {
        if (result.url) {
          sources.set(result.url, { url: result.url, title: result.title ?? result.url });
        }
      }
    }

    return { text, sources: Array.from(sources.values()) };
  }

  const response = await openai.responses.create({
    model: MODEL,
    instructions: systemPrompt,
    input: userMessage,
    max_output_tokens: 4096,
    reasoning: { effort: "medium" },
    tools: [{ type: "web_search", search_context_size: "medium" }] as never,
  });

  const text = (response.output_text ?? "").trim();

  const items = response.output as unknown as Array<{
    type: string;
    content?: Array<{
      type: string;
      annotations?: Array<{ type: string; url?: string; title?: string }>;
    }>;
  }>;

  const sources = new Map<string, ResearchSource>();
  for (const item of items) {
    if (item.type !== "message" || !item.content) continue;
    for (const block of item.content) {
      if (block.type !== "output_text" || !block.annotations) continue;
      for (const annotation of block.annotations) {
        if (annotation.type === "url_citation" && annotation.url) {
          sources.set(annotation.url, {
            url: annotation.url,
            title: annotation.title ?? annotation.url,
          });
        }
      }
    }
  }

  return { text, sources: Array.from(sources.values()) };
}
