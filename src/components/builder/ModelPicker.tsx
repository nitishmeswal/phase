"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "@/engine/store";
import {
  MODEL_CATALOG,
  PROVIDER_IDS,
  type ModelMeta,
  type ProviderId,
  type ProviderInfo,
} from "@/lib/llm";
import { loadLLMSelection } from "@/engine/persistence";

/**
 * Approximate per-call cost ($) for one "build a scene" round-trip,
 * using the average prompt mix shipped in this repo (~2k in / ~1.5k out).
 *
 * Mirrors the table on the marketing landing — useful as a quick cue in
 * the picker so users can see at-a-glance how much each model costs.
 */
function estimatePerCall(model: ModelMeta): string | null {
  const { in: pIn, out: pOut } = model.pricing;
  if (pIn == null || pOut == null) return null;
  // 2k input + 1.5k output (mid-range; matches the landing pricing card).
  const cost = (pIn * 2 + pOut * 1.5) / 1000;
  if (cost < 0.005) return `~$${cost.toFixed(4)} / call`;
  if (cost < 0.05) return `~$${cost.toFixed(3)} / call`;
  return `~$${cost.toFixed(2)} / call`;
}

const PROVIDER_COLORS: Record<ProviderId, string> = {
  anthropic: "text-amber-200",
  openai: "text-emerald-200",
  google: "text-sky-200",
  openrouter: "text-violet-200",
};

export default function ModelPicker() {
  const provider = useEngine((s) => s.llm.provider);
  const model = useEngine((s) => s.llm.model);
  const manifest = useEngine((s) => s.llm.manifest);
  const setManifest = useEngine((s) => s.setLLMManifest);
  const setProvider = useEngine((s) => s.setLLMProvider);
  const setModel = useEngine((s) => s.setLLMModel);

  const [open, setOpen] = useState(false);
  const [customModel, setCustomModel] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  // Hydrate selection + manifest once on mount.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const saved = loadLLMSelection();
    if (saved) {
      setProvider(saved.provider, saved.model);
    }

    let cancelled = false;
    fetch("/api/providers")
      .then((r) => r.json() as Promise<{ providers?: ProviderInfo[] }>)
      .then((j) => {
        if (cancelled || !j.providers) return;
        setManifest(j.providers);

        // If the user's saved provider isn't actually configured server-side,
        // fall back to the first configured one — without losing their choice
        // visually (the UI surfaces a warning instead).
        const want = saved?.provider ?? "anthropic";
        const wantInfo = j.providers.find((p) => p.id === want);
        if (!wantInfo?.configured) {
          const firstConfigured = j.providers.find((p) => p.configured);
          if (firstConfigured && firstConfigured.id !== want) {
            setProvider(firstConfigured.id, null);
          }
        }
      })
      .catch(() => {
        // Quietly ignore — the picker still works with hardcoded defaults.
      });
    return () => {
      cancelled = true;
    };
  }, [setProvider, setManifest]);

  // Close on outside-click / escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentInfo: ProviderInfo | undefined = useMemo(() => {
    if (manifest) return manifest.find((p) => p.id === provider);
    // Fallback before the manifest loads — assume catalog as-is.
    return {
      id: provider,
      label: provider,
      configured: true,
      models: MODEL_CATALOG[provider] ?? [],
      acceptsCustomModel: provider === "openrouter",
    };
  }, [manifest, provider]);

  const currentModelMeta: ModelMeta | undefined = useMemo(() => {
    const list = currentInfo?.models ?? [];
    if (model) return list.find((m) => m.id === model);
    return list.find((m) => m.default) ?? list[0];
  }, [currentInfo, model]);

  const currentModelLabel = currentModelMeta?.label ?? model ?? "Default";

  return (
    <div ref={wrapperRef} className="fixed top-5 left-44 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full text-[10px] font-mono tracking-[0.18em] uppercase backdrop-blur-md border transition-all ${
          open
            ? "bg-white/10 border-white/30 text-white"
            : "bg-white/5 border-white/10 text-white/55 hover:text-white hover:border-white/30"
        }`}
        title="Pick the LLM that translates prompts/doodles into scene-graph JSON"
      >
        <span className="text-cyan-200">▮</span>
        <span className={PROVIDER_COLORS[provider]}>{provider}</span>
        <span className="text-white/30">/</span>
        <span className="text-white/85 normal-case tracking-tight">
          {currentModelLabel}
        </span>
      </button>

      {open && (
        <div className="absolute top-12 left-0 w-[22rem] rounded-2xl border border-white/10 bg-black/85 backdrop-blur-2xl p-3 shadow-2xl space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/35 px-1 pt-1">
            Provider
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {PROVIDER_IDS.map((id) => {
              const info = manifest?.find((p) => p.id === id);
              const configured = info?.configured ?? false;
              const active = provider === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setProvider(id, null);
                    setOpen(true);
                  }}
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-[10px] font-mono uppercase tracking-widest transition-all ${
                    active
                      ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                      : configured
                      ? "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white"
                      : "border-white/5 bg-white/[0.02] text-white/30"
                  }`}
                  title={
                    configured
                      ? `Use ${id}`
                      : `${id} — no API key configured on the server`
                  }
                >
                  <span className={configured ? PROVIDER_COLORS[id] : ""}>
                    {id}
                  </span>
                  <span
                    className={`text-[8px] ${
                      configured ? "text-white/40" : "text-rose-300/60"
                    }`}
                  >
                    {configured ? "ready" : "no key"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[10px] font-mono uppercase tracking-widest text-white/35 px-1 pt-2">
            Model
          </div>
          <div className="grid gap-1">
            {(currentInfo?.models ?? []).map((m) => {
              const isActive =
                model === m.id || (model == null && m.default === true);
              const cost = estimatePerCall(m);
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setModel(m.id);
                  }}
                  className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-all ${
                    isActive
                      ? "border-cyan-300/50 bg-cyan-300/[0.06] text-white"
                      : "border-white/10 bg-white/[0.02] text-white/75 hover:border-white/25 hover:text-white"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[12px] font-medium tracking-tight truncate">
                      {m.label}
                    </div>
                    <div className="text-[10px] font-mono text-white/35 truncate">
                      {m.id}
                    </div>
                    {m.note && (
                      <div className="mt-1 text-[10px] text-white/45 leading-snug">
                        {m.note}
                      </div>
                    )}
                  </div>
                  {cost && (
                    <div className="shrink-0 text-[9px] font-mono text-cyan-200/70 whitespace-nowrap pt-0.5">
                      {cost}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {currentInfo?.acceptsCustomModel && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/35 px-1">
                Custom OpenRouter model
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="e.g. mistralai/mistral-large"
                  className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-[11px] font-mono text-white/90 placeholder-white/25 focus:outline-none focus:border-cyan-300/50"
                />
                <button
                  onClick={() => {
                    if (customModel.trim()) {
                      setModel(customModel.trim());
                      setCustomModel("");
                    }
                  }}
                  disabled={customModel.trim().length === 0}
                  className="px-3 rounded-lg text-[10px] font-mono uppercase tracking-widest bg-cyan-300/15 hover:bg-cyan-300/25 border border-cyan-300/40 text-cyan-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  use
                </button>
              </div>
            </div>
          )}

          {currentInfo && !currentInfo.configured && (
            <div className="text-[10px] font-mono text-rose-200/80 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 py-2 leading-snug">
              <span className="uppercase tracking-widest text-rose-200">
                no key
              </span>
              <span className="block mt-1 text-rose-100/70 normal-case">
                Add{" "}
                <code className="text-white/85">
                  {provider === "anthropic" && "ANTHROPIC_API_KEY"}
                  {provider === "openai" && "OPENAI_API_KEY"}
                  {provider === "google" && "GOOGLE_API_KEY"}
                  {provider === "openrouter" && "OPENROUTER_API_KEY"}
                </code>{" "}
                to your environment to enable {provider}.
              </span>
            </div>
          )}

          <div className="text-[9px] font-mono text-white/25 leading-snug pt-1 px-1">
            Stays in your browser. Server picks up{" "}
            <code className="text-white/55">LLM_PROVIDER</code> /{" "}
            <code className="text-white/55">LLM_MODEL</code> env defaults
            otherwise.
          </div>
        </div>
      )}
    </div>
  );
}
