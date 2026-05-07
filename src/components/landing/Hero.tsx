"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

export default function Hero() {
  return (
    <section className="relative isolate min-h-screen w-full overflow-hidden">
      {/* live R3F backdrop */}
      <HeroCanvas />

      {/* radial dim so copy stays legible over the canvas */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(3,4,10,0) 0%, rgba(3,4,10,0.45) 55%, rgba(3,4,10,0.85) 100%)",
        }}
      />

      {/* nav */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-12 lg:px-20 py-6">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(110,200,255,0.7)] animate-pulse" />
          <span className="text-[11px] font-mono tracking-[0.32em] text-white/70 uppercase">
            Phase
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-7 text-[10px] font-mono tracking-[0.22em] uppercase text-white/40">
          <a href="#how" className="hover:text-white transition-colors">
            How it works
          </a>
          <a href="#brushes" className="hover:text-white transition-colors">
            Brushes
          </a>
          <a href="#engine" className="hover:text-white transition-colors">
            The engine
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing
          </a>
        </nav>
        <Link
          href="/build"
          className="rounded-full px-4 py-2 text-[10px] font-mono tracking-[0.22em] uppercase border border-cyan-300/40 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20 transition-all"
        >
          Open builder →
        </Link>
      </header>

      {/* hero copy */}
      <div className="relative z-10 flex items-center min-h-[calc(100vh-100px)] px-6 md:px-12 lg:px-20">
        <div className="max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-cyan-200/70 font-mono">
              Cinematic AI-native web engine
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[7.5rem] font-black tracking-[-0.06em] leading-[0.86]">
            Sketch
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-violet-300">
              cinematic 3D
            </span>
            <br />
            websites into being.
          </h1>

          <p className="max-w-xl text-base md:text-lg text-white/55 leading-relaxed font-light">
            Type a sentence. Sketch on the canvas. Phase builds the scene
            graph, choreographs scroll timelines, animates alive proxy
            geometry, and morphs meshes between shapes — live, in your browser.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/build"
              className="rounded-full px-6 py-3 text-xs font-mono tracking-[0.22em] uppercase border bg-cyan-300/15 hover:bg-cyan-300/25 border-cyan-300/40 text-cyan-100 shadow-[0_0_28px_rgba(110,200,255,0.22)] transition-all"
            >
              ◆ Launch the builder
            </Link>
            <a
              href="#how"
              className="rounded-full px-5 py-3 text-xs font-mono tracking-[0.22em] uppercase border border-white/10 text-white/55 hover:text-white hover:border-white/30 transition-all"
            >
              See how it works ↓
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl pt-6">
            {[
              ["Prompt", "describe a scene"],
              ["Doodle", "draw the motion"],
              ["Direct", "edit in place"],
              ["Scroll", "play the film"],
            ].map(([title, sub]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/5 bg-white/[0.025] backdrop-blur-md px-4 py-3"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/60 font-mono">
                  {title}
                </div>
                <div className="mt-1 text-xs text-white/55">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-[10px] font-mono tracking-[0.32em] text-white/30 uppercase pointer-events-none animate-pulse">
        scroll ↓
      </div>
    </section>
  );
}
