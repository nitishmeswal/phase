import type { LLMProviderAdapter, LLMRequest } from "../types";
import { LLMError } from "../types";

/**
 * Google Gemini adapter (REST `generateContent` API).
 *
 * Gemini accepts a `systemInstruction` block which we map our `system` to,
 * and prefill is faked by inserting a model-role turn before the prompt.
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

    const contents: Array<{
      role: "user" | "model";
      parts: { text: string }[];
    }> = [{ role: "user", parts: [{ text: req.user }] }];
    if (req.assistantPrefill) {
      contents.push({ role: "model", parts: [{ text: req.assistantPrefill }] });
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents,
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

    return req.assistantPrefill ? req.assistantPrefill + text : text;
  },
};
