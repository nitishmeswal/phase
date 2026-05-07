"use client";

import Link from "next/link";

/**
 * Three paths into the engine: Describe / Direct / Doodle.
 *
 * Each card is an animated illustration over a static description. No live
 * R3F here — pure CSS so the section is cheap and reliable.
 */
export default function HowItWorks() {
  return (
    <section
      id="how"
      className="relative bg-[#03040a] py-28 md:py-40 px-6 md:px-12 lg:px-20 border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="space-y-5 max-w-3xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-violet-300/70">
            02 / How it works
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em] leading-[1.04]">
            Three ways to direct a scene.
          </h2>
          <p className="text-base md:text-lg text-white/50 leading-relaxed font-light">
            All three speak the same scene-graph contract. They compose —
            you can describe a scene, doodle a correction, then click an
            object to refine it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <HowCard
            number="01"
            kind="Describe"
            color="cyan"
            title="Type a sentence. Get a scene."
            example={
              <>
                <span className="text-cyan-200/80">›</span> A floating chrome
                cube descends slowly. As the user scrolls it splits apart,
                morphs into a glowing AI orb.
              </>
            }
            body="⌘K opens the prompt dock. Phase ships the scene-graph schema as the system prompt; Claude returns JSON; the engine validates and renders."
            visual={<DescribeVisual />}
          />
          <HowCard
            number="02"
            kind="Direct"
            color="violet"
            title="Click an object. Type a correction."
            example={
              <>
                <span className="text-violet-200/80">›</span> make this glow
                more · slow it down · morph into a torus knot
              </>
            }
            body="Toggle EDIT, click any mesh on the canvas, write what you want. The visual editor patches just that object — or apply it scene-wide."
            visual={<DirectVisual />}
          />
          <HowCard
            number="03"
            kind="Doodle"
            color="cyan"
            title="Sketch the motion directly."
            example={
              <>
                <span className="text-emerald-200/80">›</span> swirl over the
                cube · scribble glow · tap to drop · cross-out to erase
              </>
            }
            body="Each brush is a different motion intent. Strokes are normalized to scene coordinates so a swirl on the right side spins the object on the right side."
            visual={<DoodleVisual />}
          />
        </div>

        <div className="flex justify-center pt-4">
          <Link
            href="/build"
            className="rounded-full px-6 py-3 text-xs font-mono tracking-[0.22em] uppercase border bg-cyan-300/15 hover:bg-cyan-300/25 border-cyan-300/40 text-cyan-100 shadow-[0_0_28px_rgba(110,200,255,0.18)] transition-all"
          >
            Try all three →
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowCard({
  number,
  kind,
  title,
  example,
  body,
  visual,
  color,
}: {
  number: string;
  kind: string;
  title: string;
  example: React.ReactNode;
  body: string;
  visual: React.ReactNode;
  color: "cyan" | "violet";
}) {
  const ringClass =
    color === "cyan"
      ? "from-cyan-400/30 to-cyan-300/0"
      : "from-violet-400/30 to-violet-300/0";
  const accent = color === "cyan" ? "text-cyan-200/70" : "text-violet-200/70";
  return (
    <div className="group relative rounded-3xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/15 transition-colors">
      <div
        className={`absolute inset-x-0 -top-px h-px bg-gradient-to-r ${ringClass} opacity-70`}
      />
      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent border-b border-white/5">
        {visual}
      </div>
      <div className="p-6 space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-[10px] font-mono text-white/25">{number}</span>
          <span
            className={`text-[10px] font-mono uppercase tracking-[0.28em] ${accent}`}
          >
            {kind}
          </span>
        </div>
        <h3 className="text-xl font-semibold tracking-[-0.02em] leading-snug">
          {title}
        </h3>
        <div className="rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-[11px] font-mono text-white/55 leading-relaxed">
          {example}
        </div>
        <p className="text-sm text-white/45 leading-6 font-light">{body}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiny animated visuals (CSS only, no R3F)                          */
/* ------------------------------------------------------------------ */

function DescribeVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      <div className="w-full max-w-[260px] rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-4 shadow-2xl">
        <div className="text-[9px] font-mono text-white/30 tracking-widest uppercase mb-2">
          Prompt
        </div>
        <div className="text-xs text-white/80 leading-snug font-mono">
          <span>A floating chrome cube descends, </span>
          <span className="text-cyan-300">morphs</span>
          <span> into a glowing</span>
          <span className="inline-block w-2 h-3 ml-0.5 bg-cyan-300/80 align-middle animate-pulse" />
        </div>
        <div className="mt-3 flex justify-end">
          <span className="text-[9px] font-mono text-cyan-200/70 border border-cyan-300/30 rounded px-2 py-0.5">
            ⌘ ↵
          </span>
        </div>
      </div>
    </div>
  );
}

function DirectVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Floating cube with selection ring */}
      <div className="relative">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-200/30 to-violet-300/15 border border-white/15 backdrop-blur-sm shadow-[0_0_40px_rgba(110,200,255,0.25)]" />
        <div className="absolute -inset-3 border border-violet-300/40 rounded-2xl pointer-events-none" />
        <div className="absolute -top-2 -right-2 w-2 h-2 rounded-full bg-violet-300 animate-ping" />
      </div>
      {/* tooltip */}
      <div className="absolute right-6 bottom-6 max-w-[180px] rounded-xl border border-violet-300/30 bg-black/70 backdrop-blur-md p-3">
        <div className="text-[9px] font-mono text-violet-300/70 tracking-widest uppercase mb-1.5">
          Direction
        </div>
        <div className="text-[11px] font-mono text-white/80 leading-snug">
          make this glow more
        </div>
      </div>
    </div>
  );
}

function DoodleVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* base shape */}
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-200/20 to-violet-300/10 border border-white/10" />
      {/* swirl drawn over it */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a985ff" />
            <stop offset="100%" stopColor="#61f6ff" />
          </linearGradient>
        </defs>
        <path
          d="M 100 60 C 130 60 145 90 130 115 C 115 140 80 135 75 105 C 70 75 105 70 115 95"
          fill="none"
          stroke="url(#ink)"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.9"
          style={{ filter: "drop-shadow(0 0 6px rgba(169,133,255,0.6))" }}
        />
        <text
          x="138"
          y="100"
          fill="#a985ff"
          fontSize="14"
          fontFamily="monospace"
          opacity="0.8"
        >
          ◌
        </text>
      </svg>
      {/* brush badge */}
      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 backdrop-blur-md px-2.5 py-1">
        <span className="text-[10px]" style={{ color: "#a985ff" }}>
          ◌
        </span>
        <span className="text-[9px] font-mono uppercase tracking-widest text-white/60">
          Swirl
        </span>
      </div>
    </div>
  );
}
