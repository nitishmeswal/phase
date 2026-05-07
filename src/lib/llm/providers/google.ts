import type { LLMProviderAdapter, LLMRequest } from "../types";
import { LLMError } from "../types";

/**
 * Google Gemini adapter (REST `generateContent` API).
 *
 * Gemini accepts a `systemInstruction` block which we map our `system` to.
 *
 * `responseMimeType: "application/json"` constrains the model to output
 * a complete, valid JSON value (object or array), so we don't try to fake
 * an Anthropic-style `assistantPrefill` here — we just nudge the model
 * via the system prompt when one is requested.
 */

interface GeminiPart {
  text?: string;
}
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string; code?: number };
}

function key(): string {
  const k =
    process.env.GOOGLE_API_KEY ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_GENAI_API_KEY;
  if (!k) {
    throw new LLMError(
      "GOOGLE_API_KEY (or GEMINI_API_KEY) is not set on the server",
      500,
      "google",
    );
  }
  return k;
}

export const googleAdapter: LLMProviderAdapter = {
  id: "google",
  label: "Google",

  isConfigured() {
    return Boolean(
      process.env.GOOGLE_API_KEY ??
        process.env.GEMINI_API_KEY ??
        process.env.GOOGLE_GENAI_API_KEY,
    );
  },

  defaultModel() {
    return process.env.GOOGLE_MODEL ?? "gemini-2.5-flash";
  },

  async call(req: LLMRequest, model: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(key())}`;

    // assistantPrefill is treated as a soft hint via the system prompt.
    // Gemini's `responseMimeType: application/json` ensures the response
    // is valid JSON regardless, and (unlike OpenAI's json_object) does not
    // restrict the top level to an object — arrays are allowed.
    const system = req.assistantPrefill
      ? `${req.system}\n\nIMPORTANT: Begin your response with "${req.assistantPrefill}" and output only raw JSON. No prose, no markdown fences.`
      : req.system;

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: req.user }] }],
        generationConfig: {
          temperature: req.temperature ?? 0.7,
          maxOutputTokens: req.maxTokens ?? 4096,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new LLMError(
        `Google ${res.status}: ${text.slice(0, 400)}`,
        res.status,
        "google",
      );
    }

    const json = (await res.json()) as GeminiResponse;
    if (json.error) {
      throw new LLMError(json.error.message, 502, "google");
    }

    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .map((p) => p.text ?? "")
      .join("\n")
      .trim();

    if (!text) throw new LLMError("Empty response from model", 502, "google");

    return text;
  },
};
