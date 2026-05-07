import { LLMError } from "./types";

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
    throw new LLMError(
      `Model returned non-JSON output: ${(err as Error).message}\n\nRaw:\n${raw.slice(0, 800)}`,
      502,
      null,
    );
  }
}
