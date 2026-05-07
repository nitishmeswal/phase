import type { LLMProviderAdapter, LLMRequest } from "../types";
import { LLMError } from "../types";

const URL = "https://api.anthropic.com/v1/messages";

interface AnthropicTextBlock {
  type: "text";
  text: string;
}
interface AnthropicResponse {
  content: Array<AnthropicTextBlock | { type: string }>;
  stop_reason?: string;
  error?: { type: string; message: string };
}

function key(): string {
  const k = process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY_2;
  if (!k) {
    throw new LLMError(
      "ANTHROPIC_API_KEY is not set on the server",
      500,
      "anthropic",
    );
  }
  return k;
}

export const anthropicAdapter: LLMProviderAdapter = {
  id: "anthropic",
  label: "Anthropic",

  isConfigured() {
    return Boolean(
      process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY_2,
    );
  },

  defaultModel() {
    return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
  },

  async call(req: LLMRequest, model: string): Promise<string> {
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      { role: "user", content: req.user },
    ];
    if (req.assistantPrefill) {
      messages.push({ role: "assistant", content: req.assistantPrefill });
    }

    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "x-api-key": key(),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens ?? 4096,
        temperature: req.temperature ?? 0.7,
        system: req.system,
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LLMError(
        `Anthropic ${res.status}: ${text.slice(0, 400)}`,
        res.status,
        "anthropic",
      );
    }

    const json = (await res.json()) as AnthropicResponse;
    if (json.error) {
      throw new LLMError(json.error.message, 502, "anthropic");
    }

    const text = json.content
      .filter(
        (b): b is AnthropicTextBlock =>
          b.type === "text" && typeof (b as AnthropicTextBlock).text === "string",
      )
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) throw new LLMError("Empty response from model", 502, "anthropic");

    return req.assistantPrefill ? req.assistantPrefill + text : text;
  },
};
