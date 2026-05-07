"use client";

/**
 * The mental model. Engine = moat. LLM = stateless interpreter.
 *
 * This is the section a builder/founder reads to understand why Phase
 * isn't a "GPT wrapper".
 */
export default function Engine() {
  return (
    <section
      id="engine"
      className="relative bg-[#03040a] py-28 md:py-40 px-6 md:px-12 lg:px-20 border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="space-y-5 max-w-3xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-cyan-300/70">
            04 / The mental model
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em] leading-[1.04]">
            The engine is the product.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-violet-300">
              The LLM is a typewriter.
            </span>
          </h2>
          <p className="text-base md:text-lg text-white/50 leading-relaxed font-light">
            Anthropic, OpenAI, your own fine-tune, an offline DSL parser —
            they all output the same JSON. Phase&apos;s scene-graph contract
            is the API. Everything that makes the experience cinematic lives
            on the client.
          </p>
        </div>

        {/* Pipeline diagram */}
        <div className="rounded-3xl border border-white/8 bg-gradient-to-b from-white/[0.025] to-transparent p-6 md:p-10 overflow-x-auto">
          <div className="min-w-[760px] grid grid-cols-5 items-stretch gap-2 text-center">
            <Stage
              kicker="Input"
              title="Prompt / Doodle"
              hint="Text or strokes"
              color="#61f6ff"
            />
            <Arrow />
            <Stage
              kicker="Interpreter"
              title="LLM (swappable)"
              hint="Claude / GPT-4 / local"
              color="#a985ff"
              dim
            />
            <Arrow />
            <Stage
              kicker="Engine (yours)"
              title="Scene graph + R3F + GSAP"
              hint="Validate · render · choreograph"
              color="#7cffd0"
              wide
            />
          </div>
          <div className="mt-6 text-[11px] font-mono text-white/35 text-center">
            ↑ The dashed box is the only part that calls a model. Everything
            else is the engine.
          </div>
        </div>

        {/* Side-by-side: what the LLM does, what the engine does */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Column
            kicker="The LLM does"
            color="violet"
            items={[
              ["Translates language → JSON", "language is the input format"],
              ["Reads the scene-graph schema", "shipped as system prompt"],
              ["Returns one JSON object", "scene / object / patch"],
              ["Knows nothing about WebGL", "doesn't render, doesn't morph"],
            ]}
          />
          <Column
            kicker="The engine does"
            color="cyan"
            items={[
              ["Renders & post-processes", "R3F · bloom · vignette · CA"],
              ["Drives scroll choreography", "GSAP ScrollTrigger timelines"],
              ["Animates alive geometry", "breathe · pulse · float · spin"],
              ["Morphs meshes vertex-by-vertex", "BufferGeometry interpolation"],
              ["Validates untrusted JSON", "clamps, dedupes, never crashes"],
              ["Persists projects locally", "localStorage, no auth required"],
            ]}
          />
        </div>

        {/* Replaceability statement */}
        <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-violet-500/8 to-cyan-500/4 p-6 md:p-8 space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-violet-200/70">
            Why this matters
          </div>
          <div className="text-base md:text-lg text-white/75 leading-relaxed font-light max-w-3xl">
            When a better model ships, you flip the picker in the builder
            (Anthropic / OpenAI / Google / OpenRouter) — or drop a new
            adapter into{" "}
            <span className="font-mono text-cyan-200/80">
              src/lib/llm/providers/
            </span>{" "}
            and ship. The renderer, the scroll choreography, the morph engine
            — your moat — never changes.
          </div>
        </div>
      </div>
    </section>
  );
}

function Stage({
  kicker,
  title,
  hint,
  color,
  dim = false,
  wide = false,
}: {
  kicker: string;
  title: string;
  hint: string;
  color: string;
  dim?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-5 ${wide ? "md:px-6" : ""} ${
        dim
          ? "border border-dashed border-white/15 bg-white/[0.015]"
          : "border border-white/10 bg-white/[0.025]"
      }`}
      style={
        dim
          ? undefined
          : { boxShadow: `inset 0 0 0 1px ${color}22, 0 0 24px ${color}11` }
      }
    >
      <div
        className="text-[9px] font-mono uppercase tracking-[0.24em]"
        style={{ color: `${color}aa` }}
      >
        {kicker}
      </div>
      <div className="mt-2 text-sm md:text-[15px] font-semibold text-white/85 leading-snug">
        {title}
      </div>
      <div className="mt-1.5 text-[10px] font-mono text-white/35 leading-tight">
        {hint}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center text-white/25 text-2xl font-light">
      →
    </div>
  );
}

function Column({
  kicker,
  color,
  items,
}: {
  kicker: string;
  color: "cyan" | "violet";
  items: [string, string][];
}) {
  const accent =
    color === "cyan"
      ? "text-cyan-200/70 from-cyan-400/30"
      : "text-violet-200/70 from-violet-400/30";
  return (
    <div className="relative rounded-3xl border border-white/8 bg-white/[0.02] p-7 overflow-hidden">
      <div
        className={`absolute inset-x-0 -top-px h-px bg-gradient-to-r ${accent} to-transparent opacity-70`}
      />
      <div
        className={`text-[10px] font-mono uppercase tracking-[0.28em] ${accent.split(" ")[0]}`}
      >
        {kicker}
      </div>
      <ul className="mt-5 space-y-3">
        {items.map(([title, sub]) => (
          <li key={title} className="flex gap-3 items-baseline">
            <span className="text-white/30 text-xs font-mono mt-1">▸</span>
            <div>
              <div className="text-sm text-white/85 leading-snug">{title}</div>
              <div className="text-[11px] font-mono text-white/35 mt-0.5">
                {sub}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
