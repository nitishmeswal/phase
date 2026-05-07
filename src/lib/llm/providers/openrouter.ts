import type { LLMProviderAdapter, LLMRequest } from "../types";
import { LLMError } from "../types";

/**
 * OpenRouter adapter — OpenAI-compatible chat completions endpoint that
 * fronts dozens of models behind a single API key.
 *
 * Useful as an escape hatch: lets you point Phase at DeepSeek, Llama,
 * Qwen, Mistral, etc. without writing more adapters.
 */
const URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenAIChoice {
  message?: { content?: string };
  finish_reason?: string;
}
interface OpenRouterResponse {
  choices?: OpenAIChoice[];
  error?: { message: string };
}

function key(): string {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) {
    throw new LLMError(
      "OPENROUTER_API_KEY is not set on the server",
      500,
      "openrouter",
    );
  }
  return k;
}

export const openrouterAdapter: LLMProviderAdapter = {
  id: "openrouter",
  label: "OpenRouter",

  isConfigured() {
    return Boolean(process.env.OPENROUTER_API_KEY);
  },

  defaultModel() {
    return process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-4";
  },

  async call(req: LLMRequest, model: string): Promise<string> {
    const system = req.assistantPrefill
      ? `${req.system}\n\nIMPORTANT: Begin your response with "${req.assistantPrefill}" and output only raw JSON. No prose, no markdown fences.`
      : req.system;

    const res = await fetch(URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key()}`,
        "content-type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL ?? "https://github.com/nitishmeswal/phase",
        "X-Title": "Phase",
      },
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens ?? 4096,
        temperature: req.temperature ?? 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: req.user },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LLMError(
        `OpenRouter ${res.status}: ${text.slice(0, 400)}`,
        res.status,
        "openrouter",
      );
    }

    const json = (await res.json()) as OpenRouterResponse;
    if (json.error) {
      throw new LLMError(json.error.message, 502, "openrouter");
    }

    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new LLMError("Empty response from model", 502, "openrouter");
    }

    return text;
  },
};
