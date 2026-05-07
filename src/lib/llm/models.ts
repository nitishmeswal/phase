import type { ModelMeta, ProviderId } from "./types";

/**
 * Curated catalog of supported models per provider.
 *
 * Pricing is per-million tokens in USD. These numbers shape the per-call
 * cost estimates shown in the model picker UI and on the landing page —
 * keep them in sync with the providers' published prices.
 *
 * Last verified: May 2026.
 */
export const MODEL_CATALOG: Record<ProviderId, ModelMeta[]> = {
  anthropic: [
    {
      id: "claude-sonnet-4-20250514",
      provider: "anthropic",
      label: "Claude Sonnet 4",
      pricing: { in: 3, out: 15 },
      default: true,
      note: "Best balance of quality and cost for cinematic scene work.",
    },
    {
      id: "claude-opus-4-20250514",
      provider: "anthropic",
      label: "Claude Opus 4",
      pricing: { in: 15, out: 75 },
      note: "Highest quality, ~5× the cost of Sonnet. Use for tough briefs.",
    },
    {
      id: "claude-haiku-4-5-20251001",
      provider: "anthropic",
      label: "Claude Haiku 4.5",
      pricing: { in: 1, out: 5 },
      note: "Fast & cheap. Great for object-level edits and small tweaks.",
    },
  ],

  openai: [
    {
      id: "gpt-4o",
      provider: "openai",
      label: "GPT-4o",
      pricing: { in: 2.5, out: 10 },
      default: true,
      note: "Strong scene generation, slightly cheaper than Sonnet.",
    },
    {
      id: "gpt-4o-mini",
      provider: "openai",
      label: "GPT-4o mini",
      pricing: { in: 0.15, out: 0.6 },
      note: "Very cheap. ~5× less than Sonnet, good for iterating.",
    },
    {
      id: "gpt-4.1",
      provider: "openai",
      label: "GPT-4.1",
      pricing: { in: 2, out: 8 },
      note: "OpenAI's reasoning-leaning workhorse.",
    },
  ],

  google: [
    {
      id: "gemini-2.5-flash",
      provider: "google",
      label: "Gemini 2.5 Flash",
      pricing: { in: 0.075, out: 0.3 },
      default: true,
      note: "Cheapest of the bunch. Fast iteration mode.",
    },
    {
      id: "gemini-2.5-pro",
      provider: "google",
      label: "Gemini 2.5 Pro",
      pricing: { in: 1.25, out: 10 },
      note: "Strong long-context reasoning.",
    },
  ],

  openrouter: [
    {
      id: "anthropic/claude-sonnet-4",
      provider: "openrouter",
      label: "Claude Sonnet 4 (via OpenRouter)",
      pricing: { in: 3, out: 15 },
      default: true,
    },
    {
      id: "deepseek/deepseek-chat",
      provider: "openrouter",
      label: "DeepSeek V3",
      pricing: { in: 0.27, out: 1.1 },
      note: "Open-weights model, very competitive on quality.",
    },
    {
      id: "meta-llama/llama-3.3-70b-instruct",
      provider: "openrouter",
      label: "Llama 3.3 70B",
      pricing: { in: 0.59, out: 0.79 },
      note: "Open-source. Cheap and reasonable.",
    },
    {
      id: "qwen/qwen3-32b",
      provider: "openrouter",
      label: "Qwen3 32B",
      pricing: { in: 0.15, out: 0.6 },
      note: "Open-source. Fast and cheap.",
    },
  ],
};

export function findModel(
  provider: ProviderId,
  modelId: string,
): ModelMeta | undefined {
  return MODEL_CATALOG[provider]?.find((m) => m.id === modelId);
}

export function defaultModelFor(provider: ProviderId): string {
  const list = MODEL_CATALOG[provider];
  if (!list || list.length === 0) {
    throw new Error(`No models registered for provider "${provider}"`);
  }
  return (list.find((m) => m.default) ?? list[0]).id;
}
