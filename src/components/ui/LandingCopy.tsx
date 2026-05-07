"use client";

import { useEngine } from "@/engine/store";

export default function LandingCopy() {
  const scenes = useEngine((s) => s.scenes);
  const currentSceneIndex = useEngine((s) => s.currentSceneIndex);
  const globalProgress = useEngine((s) => s.globalProgress);
  const scene = scenes[currentSceneIndex];

  return (
    <main className="relative z-10 pointer-events-none min-h-screen">
      <section className="min-h-screen flex items-center px-6 md:px-16 lg:px-24">
        <div className="max-w-5xl space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/15 bg-cyan-400/5 px-4 py-2 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
            <span className="text-[10px] md:text-xs uppercase tracking-[0.32em] text-cyan-200/70 font-mono">
              Phase / Cinematic AI-Native Web Engine
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-[-0.08em] leading-[0.88] max-w-4xl">
            Describe scenes.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-violet-300">
              Direct motion.
            </span>
            <br />
            Export cinema.
          </h1>

          <p className="max-w-2xl text-sm md:text-base text-white/45 leading-7 font-light">
            This MVP starts with the correct foundation: proxy geometry,
            scene-based architecture, scroll choreography, object metadata,
            semantic morphing, and a visual correction layer. It is not a
            finished builder yet — it is the engine spine.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl pt-4">
            {[
              "Scene graph",
              "Scroll timelines",
              "Alive geometry",
              "Visual edits",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/5 bg-white/[0.025] backdrop-blur-md p-4"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-mono">
                  Module
                </div>
                <div className="mt-2 text-sm text-white/70">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating current scene panel */}
      {scene && (
        <section className="fixed top-24 left-6 md:left-16 z-30 max-w-sm transition-all duration-700">
          <div className="rounded-3xl border border-white/5 bg-black/30 backdrop-blur-xl p-5 shadow-2xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-cyan-300/60">
              {scene.label}
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-white/90">
              {scene.description.split(":")[0]}
            </h2>
            <p className="mt-3 text-xs leading-6 text-white/40 font-light">
              {scene.description}
            </p>
            <div className="mt-5 h-px bg-white/10 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all duration-150"
                style={{ width: `${globalProgress * 100}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Spacer content so scrolling feels intentional */}
      <div className="h-[420vh]" />
    </main>
  );
}
