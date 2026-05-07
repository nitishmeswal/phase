"use client";

import { useEffect, useRef, useState } from "react";
import { useEngine } from "@/engine/store";

const PROMPT_EXAMPLES: { label: string; prompt: string }[] = [
  {
    label: "Chrome cube → AI orb",
    prompt:
      "A floating chrome cube descends slowly. As the user scrolls it splits apart, morphs into a glowing AI orb, then settles behind the hero section.",
  },
  {
    label: "Crystalline shard burst",
    prompt:
      "A wireframe crystalline shard hovers in deep navy fog. As the user scrolls, the shard vibrates, anticipates, then bursts outward into smaller orbiting fragments around a violet hologram core.",
  },
  {
    label: "Pulsing AI core",
    prompt:
      "A pulsing emissive AI core breathes in the center of the canvas, surrounded by a slowly rotating hologram halo. Camera pushes in as user scrolls.",
  },
  {
    label: "Three-act sequence",
    prompt:
      "Build three connected scenes: 1) a chrome cube descends in cinematic fog, 2) it cracks open into glass shards orbiting a glowing core, 3) the core morphs into a torus knot AI emblem.",
  },
];

export default function PromptDock() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"replace" | "append">("replace");
  const [multi, setMulti] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const status = useEngine((s) => s.builder.status);
  const lastError = useEngine((s) => s.builder.lastError);
  const doodleOn = useEngine((s) => s.doodle.enabled);
  const llmProvider = useEngine((s) => s.llm.provider);
  const llmModel = useEngine((s) => s.llm.model);
  const setScenes = useEngine((s) => s.setScenes);
  const appendScenes = useEngine((s) => s.appendScenes);
  const setBuilderStatus = useEngine((s) => s.setBuilderStatus);
  const setBuilderError = useEngine((s) => s.setBuilderError);
  const setLastPrompt = useEngine((s) => s.setLastPrompt);
  const setIsUserProject = useEngine((s) => s.setIsUserProject);
  const setToast = useEngine((s) => s.setToast);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const generating = status === "generating";

  async function submit() {
    const trimmed = prompt.trim();
    if (!trimmed || generating) return;

    setLastPrompt(trimmed);
    setBuilderError(null);
    setBuilderStatus("generating");

    try {
      const res = await fetch("/api/generate-scene", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          multi,
          provider: llmProvider,
          model: llmModel ?? undefined,
        }),
      });
      const json = (await res.json()) as {
        scenes?: import("@/engine/types").SceneDefinition[];
        error?: string;
      };
      if (!res.ok || !json.scenes || json.scenes.length === 0) {
        const msg = json.error || `Request failed (${res.status})`;
        setBuilderError(msg);
        setToast(`Generation failed: ${msg}`);
        setBuilderStatus("error");
        return;
      }

      if (mode === "replace") setScenes(json.scenes);
      else appendScenes(json.scenes);

      setIsUserProject(true);
      setBuilderStatus("idle");
      setToast(
        json.scenes.length === 1
          ? "Scene generated."
          : `${json.scenes.length} scenes generated.`,
      );
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setBuilderError(msg);
      setToast(`Generation failed: ${msg}`);
      setBuilderStatus("error");
    }
  }

  return (
    <>
      {!doodleOn && (
      <button
        data-prompt-dock-trigger
        onClick={() => setOpen(true)}
        className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 group"
      >
        <div className="flex items-center gap-3 rounded-full border border-cyan-300/30 bg-black/60 backdrop-blur-xl px-5 py-3 shadow-[0_0_30px_rgba(0,255,255,0.12)] transition-all duration-300 group-hover:border-cyan-200/60 group-hover:shadow-[0_0_44px_rgba(0,255,255,0.25)]">
          <span className="text-cyan-300 text-base">◆</span>
          <span className="text-[11px] font-mono tracking-[0.32em] text-white/70 group-hover:text-white">
            DESCRIBE A SCENE
          </span>
          <kbd className="text-[10px] font-mono text-white/30 border border-white/10 rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>
      </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={() => !generating && setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#070812]/95 backdrop-blur-2xl p-6 md:p-8 shadow-[0_0_60px_rgba(110,200,255,0.15)] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-cyan-300/70">
                  Phase Builder
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  Describe the cinematic scene
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  Plain English. The engine choreographs proxy geometry,
                  scroll, and morphing for you.
                </p>
              </div>
              <button
                onClick={() => !generating && setOpen(false)}
                className="text-white/30 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              disabled={generating}
              placeholder="A floating chrome cube descends slowly… as the user scrolls it splits apart, morphs into a glowing AI orb…"
              rows={4}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white/90 placeholder-white/25 font-light leading-6 focus:outline-none focus:border-cyan-300/50 focus:bg-white/[0.07] transition-all resize-none"
            />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 mr-2">
                Try:
              </span>
              {PROMPT_EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setPrompt(ex.prompt)}
                  className="text-[10px] font-mono px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-white/50 hover:text-cyan-200 hover:border-cyan-300/40 hover:bg-cyan-300/[0.04] transition-all"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5">
              <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-[10px] font-mono">
                {(["replace", "append"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 rounded-full transition-all ${
                      mode === m
                        ? "bg-cyan-300/15 text-cyan-200"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {m === "replace" ? "REPLACE PROJECT" : "APPEND SCENE"}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 text-[10px] font-mono text-white/50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={multi}
                  onChange={(e) => setMulti(e.target.checked)}
                  className="accent-cyan-300"
                />
                MULTI-SCENE SEQUENCE
              </label>

              <div className="flex-1" />

              <div className="text-[10px] font-mono text-white/25 hidden md:block">
                ⌘ENTER to build
              </div>
              <button
                onClick={submit}
                disabled={generating || prompt.trim().length === 0}
                className="rounded-full px-5 py-2.5 text-[11px] font-mono tracking-[0.18em] uppercase border transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-cyan-300/15 hover:bg-cyan-300/25 border-cyan-300/40 text-cyan-100 shadow-[0_0_24px_rgba(110,200,255,0.18)]"
              >
                {generating ? "Choreographing…" : "Build scene"}
              </button>
            </div>

            {lastError && status === "error" && (
              <div className="text-[11px] font-mono text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {lastError}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
