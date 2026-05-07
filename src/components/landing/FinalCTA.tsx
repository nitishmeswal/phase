"use client";

import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="relative bg-[#03040a] py-32 md:py-44 px-6 md:px-12 lg:px-20 border-t border-white/5 overflow-hidden">
      {/* glow halo */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(110,200,255,0.18) 0%, rgba(169,133,255,0.08) 35%, transparent 70%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center space-y-10">
        <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-cyan-300/70">
          Ready
        </div>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-[-0.05em] leading-[0.95]">
          Open the builder.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-violet-300">
            Start with a sentence.
          </span>
        </h2>
        <p className="max-w-xl mx-auto text-base md:text-lg text-white/55 font-light leading-relaxed">
          The demo project loads instantly with three hand-authored cinematic
          scenes. Add an Anthropic key when you&apos;re ready to author your
          own. Everything saves to your browser.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/build"
            className="rounded-full px-7 py-3.5 text-xs font-mono tracking-[0.22em] uppercase border bg-cyan-300/15 hover:bg-cyan-300/25 border-cyan-300/40 text-cyan-100 shadow-[0_0_36px_rgba(110,200,255,0.28)] transition-all"
          >
            ◆ Launch the builder
          </Link>
          <a
            href="https://github.com/nitishmeswal/phase"
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-5 py-3.5 text-xs font-mono tracking-[0.22em] uppercase border border-white/10 text-white/55 hover:text-white hover:border-white/30 transition-all"
          >
            View on GitHub →
          </a>
        </div>
      </div>
    </section>
  );
}
