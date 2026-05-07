/**
 * LLM provider abstraction.
 *
 * Every adapter (Anthropic, OpenAI, Google, OpenRouter) implements the
 * single `call` entrypoint below. Routes never talk to provider SDKs
 * directly — they hit `callLLM()` in ../index.ts which dispatches by
 * provider id.
 *
 * The contract is intentionally narrow. We only need:
 *   - one system prompt
 *   - one user message
 *   - optional "prefill" of the assistant's reply (used to nudge JSON
 *     output; only Anthropic supports this natively, others fall back
 *     to a stronger system instruction)
 */

export const PROVIDER_IDS = [
  "anthropic",
  "openai",
  "google",
  "openrouter",
] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

export interface LLMRequest {
  system: string;
  user: string;
  /** Force the model to start its reply with this prefix. Best-effort across
   * providers — Anthropic supports it natively, others get a synthetic
   * instruction in the system prompt. */
  assistantPrefill?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMCallOptions extends LLMRequest {
  provider?: ProviderId;
  model?: string;
}

export interface ModelMeta {
  id: string;
  provider: ProviderId;
  label: string;
  /** Approximate per-million-token pricing in USD. `null` = unknown / varies. */
  pricing: { in: number | null; out: number | null };
  /** True if this is the recommended default for its provider. */
  default?: boolean;
  /** Human-readable note shown in the picker. */
  note?: string;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  /** True if the server has the API key for this provider configured. */
  configured: boolean;
  models: ModelMeta[];
  /** When true, the user can type any model id (OpenRouter). */
  acceptsCustomModel?: boolean;
}

export class LLMError extends Error {
  status: number;
  provider: ProviderId | null;
  constructor(message: string, status: number, provider: ProviderId | null) {
    super(message);
    this.status = status;
    this.provider = provider;
    this.name = "LLMError";
  }
}

/**
 * Adapter interface every provider implements.
 */
export interface LLMProviderAdapter {
  id: ProviderId;
  label: string;
  /** Returns true if the API key for this provider is set on the server. */
  isConfigured(): boolean;
  /** The default model id for this provider when one isn't specified. */
  defaultModel(): string;
  /** Make the actual HTTP call and return the model's text output. */
  call(req: LLMRequest, model: string): Promise<string>;
}
