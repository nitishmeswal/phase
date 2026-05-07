"use client";

/**
 * The 30-second pitch. Educational. Tells the user immediately:
 *  - what Phase is
 *  - why it isn't just another AI website builder
 *  - the one-line mental model (engine = moat, LLM = interpreter)
 */
export default function WhatItIs() {
  return (
    <section className="relative bg-[#04050d] py-28 md:py-40 px-6 md:px-12 lg:px-20 border-t border-white/5">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="space-y-5 max-w-3xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-cyan-300/70">
            01 / What Phase is
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em] leading-[1.04]">
            Most AI builders ship layouts.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-violet-300">
              Phase ships motion.
            </span>
          </h2>
          <p className="text-base md:text-lg text-white/50 leading-relaxed font-light">
            Lovable, v0, Bolt — they generate static layouts, CRUD pages,
            dashboards. Phase generates *cinematic* sites: scroll-driven 3D
            scenes where chrome cubes morph into glowing orbs, particles
            swirl on cue, and every section feels like an interactive film.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PitchCard
            kicker="The thing"
            title="A web engine that thinks in scenes, not pages."
            body="Every section is a 3D scene with its own camera, lighting, objects, animation, morph state, and post-processing. Scroll moves you through the film."
            color="from-cyan-400/40 to-cyan-300/0"
          />
          <PitchCard
            kicker="The trick"
            title="Three ways to direct a scene: text, click, doodle."
            body="Describe it in plain English. Click any object and type a correction. Or sketch the motion directly on the canvas — a swirl spins a cube, a scribble makes it glow."
            color="from-violet-400/40 to-violet-300/0"
          />
          <PitchCard
            kicker="The truth"
            title="The engine is the moat. The LLM is replaceable."
            body="Anthropic, OpenAI, your own fine-tune — Phase doesn't care. The engine, the morph system, the scroll choreography are yours. The model is a stateless interpreter."
            color="from-emerald-400/40 to-emerald-300/0"
          />
        </div>
      </div>
    </section>
  );
}

function PitchCard({
  kicker,
  title,
  body,
  color,
}: {
  kicker: string;
  title: string;
  body: string;
  color: string;
}) {
  return (
    <div className="group relative rounded-3xl border border-white/8 bg-white/[0.02] backdrop-blur-sm p-7 overflow-hidden hover:border-white/15 transition-colors">
      <div
        className={`absolute inset-x-0 -top-px h-px bg-gradient-to-r ${color} opacity-60`}
      />
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">
        {kicker}
      </div>
      <h3 className="mt-4 text-xl md:text-2xl font-semibold leading-snug tracking-[-0.02em]">
        {title}
      </h3>
      <p className="mt-4 text-sm text-white/45 leading-7 font-light">{body}</p>
    </div>
  );
}
