import type {
  LLMCallOptions,
  LLMProviderAdapter,
  ProviderId,
  ProviderInfo,
} from "./types";
import { LLMError, PROVIDER_IDS } from "./types";
import { anthropicAdapter } from "./providers/anthropic";
import { openaiAdapter } from "./providers/openai";
import { googleAdapter } from "./providers/google";
import { openrouterAdapter } from "./providers/openrouter";
import { MODEL_CATALOG, defaultModelFor, findModel } from "./models";

export { LLMError, PROVIDER_IDS } from "./types";
export type {
  LLMCallOptions,
  LLMRequest,
  ModelMeta,
  ProviderId,
  ProviderInfo,
} from "./types";
export { MODEL_CATALOG, findModel } from "./models";
export { extractJson, parseJsonFromModel } from "./json";

const ADAPTERS: Record<ProviderId, LLMProviderAdapter> = {
  anthropic: anthropicAdapter,
  openai: openaiAdapter,
  google: googleAdapter,
  openrouter: openrouterAdapter,
};

/**
 * Pick the provider for a request.
 *
 * Precedence:
 *   1. explicit `provider` argument (from request body)
 *   2. `LLM_PROVIDER` env var
 *   3. first provider that has an API key configured
 *   4. anthropic (so the error message is sensible)
 */
function pickProvider(requested?: ProviderId): ProviderId {
  if (requested && PROVIDER_IDS.includes(requested)) return requested;

  const fromEnv = process.env.LLM_PROVIDER as ProviderId | undefined;
  if (fromEnv && PROVIDER_IDS.includes(fromEnv)) return fromEnv;

  for (const id of PROVIDER_IDS) {
    if (ADAPTERS[id].isConfigured()) return id;
  }
  return "anthropic";
}

function pickModel(provider: ProviderId, requested?: string): string {
  if (requested && requested.trim()) return requested.trim();
  return process.env.LLM_MODEL ?? defaultModelFor(provider);
}

/**
 * Single entrypoint every API route uses.
 */
export async function callLLM(opts: LLMCallOptions): Promise<string> {
  const providerId = pickProvider(opts.provider);
  const adapter = ADAPTERS[providerId];

  if (!adapter.isConfigured()) {
    throw new LLMError(
      `Provider "${providerId}" is selected but its API key is not configured on the server.`,
      500,
      providerId,
    );
  }

  const model = pickModel(providerId, opts.model);

  // Lightweight model validation: if the provider doesn't accept arbitrary
  // model ids and the requested one isn't in our catalog, surface a clearer
  // error than a 4xx from the upstream provider.
  if (providerId !== "openrouter") {
    const known = findModel(providerId, model);
    if (!known) {
      // Don't fail hard — a user may legitimately want a newer model id —
      // but log it so it shows up in dev.
      // eslint-disable-next-line no-console
      console.warn(
        `[llm] model "${model}" not in catalog for provider "${providerId}". Sending anyway.`,
      );
    }
  }

  return adapter.call(
    {
      system: opts.system,
      user: opts.user,
      assistantPrefill: opts.assistantPrefill,
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
    },
    model,
  );
}

/**
 * For `/api/providers` — returns the catalog with `configured` flags so the
 * UI can grey out providers without API keys.
 */
export function listProviders(): ProviderInfo[] {
  return PROVIDER_IDS.map<ProviderInfo>((id) => ({
    id,
    label: ADAPTERS[id].label,
    configured: ADAPTERS[id].isConfigured(),
    models: MODEL_CATALOG[id],
    acceptsCustomModel: id === "openrouter",
  }));
}
