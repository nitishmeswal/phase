"use client";

import { DOODLE_TOOLS, DOODLE_TOOL_META } from "@/engine/doodle";
import Link from "next/link";

const BRUSH_EFFECTS: Record<(typeof DOODLE_TOOLS)[number], string> = {
  path: "Object drifts along the curve. Adds float + soft spin.",
  swirl: "Adds spin / orbit to the closest object. Axis from gesture plane.",
  glow: "Sets the material to glow + emissive. Boosts bloom.",
  pulse: "Adds breathe + pulse to anything inside the region.",
  burst: "Scatters 3-5 small ambient shapes around the centroid.",
  place: "Drops a new SceneObject at the tap. Pick the geometry.",
  morph: "Line A → B. First object morphs into the second's shape.",
  erase: "Cross-out an object. It disappears from the scene.",
};

export default function Brushes() {
  return (
    <section
      id="brushes"
      className="relative bg-[#04050d] py-28 md:py-40 px-6 md:px-12 lg:px-20 border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto space-y-14">
        <div className="space-y-5 max-w-3xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-emerald-300/70">
            03 / The 8 brushes
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em] leading-[1.04]">
            Each brush is a different
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-cyan-300">
              motion intent.
            </span>
          </h2>
          <p className="text-base md:text-lg text-white/50 leading-relaxed font-light">
            You aren&apos;t drawing pixels. You&apos;re drawing semantics. A
            swirl says &quot;spin this&quot;. A scribble says &quot;glow
            here&quot;. The model interprets the gesture; the engine renders
            it.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DOODLE_TOOLS.map((tool, i) => {
            const meta = DOODLE_TOOL_META[tool];
            return (
              <div
                key={tool}
                className="group relative rounded-2xl border border-white/8 bg-white/[0.02] p-5 hover:border-white/20 hover:bg-white/[0.035] transition-all overflow-hidden"
              >
                <div
                  className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 30% 0%, ${meta.color}22, transparent 60%)`,
                  }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-2xl"
                      style={{
                        color: meta.color,
                        textShadow: `0 0 18px ${meta.color}66`,
                      }}
                    >
                      {meta.symbol}
                    </span>
                    <span className="text-[9px] font-mono text-white/25">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-3 text-[11px] font-mono uppercase tracking-[0.22em] text-white/85">
                    {meta.label}
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-white/35 leading-snug min-h-[2.5em]">
                    {meta.hint}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/55 leading-snug font-light">
                    {BRUSH_EFFECTS[tool]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-cyan-500/8 to-violet-500/4 backdrop-blur-sm p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyan-200/70">
              Composability
            </div>
            <div className="text-base text-white/75 leading-relaxed">
              Strokes compose. Multiple brushes in one apply. Then layer text
              on top:{" "}
              <span className="font-mono text-cyan-200/80">
                ⌘K &quot;make it gold&quot;
              </span>
              . Same scene graph, two interpreters.
            </div>
          </div>
          <Link
            href="/build"
            className="rounded-full px-5 py-2.5 text-[11px] font-mono tracking-[0.22em] uppercase border border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20 transition-all whitespace-nowrap"
          >
            Try the brushes →
          </Link>
        </div>
      </div>
    </section>
  );
}
