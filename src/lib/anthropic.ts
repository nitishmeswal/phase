/**
 * Tiny Anthropic Messages API client.
 *
 * We don't pull in @anthropic-ai/sdk just for one POST — fetch is enough,
 * keeps the bundle small, and avoids Edge runtime quirks.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";

interface AnthropicTextBlock {
  type: "text";
  text: string;
}

interface AnthropicResponse {
  content: Array<AnthropicTextBlock | { type: string }>;
  stop_reason?: string;
  error?: { type: string; message: string };
}

export interface CallClaudeOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Force the model to start its response with this prefix (Claude prefill). */
  assistantPrefill?: string;
}

export class AnthropicError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AnthropicError";
  }
}

function pickKey(): string {
  const k = process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY_2;
  if (!k) {
    throw new AnthropicError(
      "ANTHROPIC_API_KEY is not set on the server",
      500,
    );
  }
  return k;
}

export async function callClaude(opts: CallClaudeOptions): Promise<string> {
  const key = pickKey();

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    { role: "user", content: opts.user },
  ];
  if (opts.assistantPrefill) {
    messages.push({ role: "assistant", content: opts.assistantPrefill });
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? 4096,
      temperature: opts.temperature ?? 0.7,
      system: opts.system,
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AnthropicError(
      `Anthropic ${res.status}: ${text.slice(0, 400)}`,
      res.status,
    );
  }

  const json = (await res.json()) as AnthropicResponse;
  if (json.error) {
    throw new AnthropicError(json.error.message, 502);
  }

  const text = json.content
    .filter(
      (b): b is AnthropicTextBlock =>
        b.type === "text" && typeof (b as AnthropicTextBlock).text === "string",
    )
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!text) throw new AnthropicError("Empty response from model", 502);

  // If we prefilled the assistant turn, prepend it so JSON parsers can find
  // the opening brace even though Claude only continued from there.
  return opts.assistantPrefill ? opts.assistantPrefill + text : text;
}

/**
 * Pull the first balanced JSON object/array out of a string.
 * Models sometimes wrap output in prose or markdown fences even when told not to.
 */
export function extractJson(s: string): string {
  const trimmed = s.trim();
  // strip ```json ... ``` style fences
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fenced) return fenced[1].trim();

  const firstObj = trimmed.indexOf("{");
  const firstArr = trimmed.indexOf("[");
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);
  if (start === -1) return trimmed;

  const open = trimmed[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (inStr) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return trimmed.slice(start, i + 1);
    }
  }
  return trimmed.slice(start);
}

export function parseJsonFromModel<T = unknown>(raw: string): T {
  const cleaned = extractJson(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new AnthropicError(
      `Model returned non-JSON output: ${(err as Error).message}\n\nRaw:\n${raw.slice(0, 800)}`,
      502,
    );
  }
}
