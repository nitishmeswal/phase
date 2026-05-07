import type { LLMProviderAdapter, LLMRequest } from "../types";
import { LLMError } from "../types";

/**
 * OpenAI Chat Completions adapter.
 *
 * `assistantPrefill` is faked by appending a stronger instruction to the
 * system prompt — OpenAI's API doesn't support trailing-assistant prefills
 * the way Anthropic's does. In practice, with `temperature` <= 1 and a
 * "respond with raw JSON only" system prompt, this is enough.
 */
const URL = "https://api.openai.com/v1/chat/completions";

interface OpenAIChoice {
  message?: { content?: string };
  finish_reason?: string;
}
interface OpenAIResponse {
  choices?: OpenAIChoice[];
  error?: { message: string; type?: string };
}

function key(): string {
  const k = process.env.OPENAI_API_KEY;
  if (!k) {
    throw new LLMError(
      "OPENAI_API_KEY is not set on the server",
      500,
      "openai",
    );
  }
  return k;
}

export const openaiAdapter: LLMProviderAdapter = {
  id: "openai",
  label: "OpenAI",

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  },

  defaultModel() {
    return process.env.OPENAI_MODEL ?? "gpt-4o";
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
      },
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens ?? 4096,
        temperature: req.temperature ?? 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: req.user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LLMError(
        `OpenAI ${res.status}: ${text.slice(0, 400)}`,
        res.status,
        "openai",
      );
    }

    const json = (await res.json()) as OpenAIResponse;
    if (json.error) {
      throw new LLMError(json.error.message, 502, "openai");
    }

    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new LLMError("Empty response from model", 502, "openai");

    return text;
  },
};
