"use client";

/**
 * Honest, concrete pricing. Per-action LLM token cost using current
 * Claude Sonnet 4 pricing ($3/MTok in, $15/MTok out) on the actual prompt
 * sizes shipped in this repo.
 *
 * If the model or pricing changes, update src/components/landing/Pricing.tsx
 * — this is the user-facing source of truth.
 */
export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative bg-[#04050d] py-28 md:py-40 px-6 md:px-12 lg:px-20 border-t border-white/5"
    >
      <div className="max-w-6xl mx-auto space-y-14">
        <div className="space-y-5 max-w-3xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-amber-300/70">
            05 / What it costs
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em] leading-[1.04]">
            Pay-per-prompt.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-rose-300">
              No subscriptions.
            </span>
          </h2>
          <p className="text-base md:text-lg text-white/50 leading-relaxed font-light">
            Phase the engine is free. The only thing that costs money is the
            LLM you point it at — Anthropic by default. Bring your own key.
          </p>
        </div>

        {/* Per-action cost table */}
        <div className="rounded-3xl border border-white/8 bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-baseline justify-between">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-200/70">
              Per-action cost
            </div>
            <div className="text-[10px] font-mono text-white/30">
              Claude Sonnet 4 · $3 in / $15 out per 1M tokens
            </div>
          </div>
          <div className="divide-y divide-white/5">
            <CostRow
              action="Build 1 scene from a prompt"
              tokens="~2K in / ~1.5K out"
              cost="~$0.03"
              note="Hero / single section."
            />
            <CostRow
              action="Build a 3-scene sequence"
              tokens="~2K in / ~3K out"
              cost="~$0.05"
              note="Cinematic mini-film."
            />
            <CostRow
              action="Edit one object"
              tokens="~2.5K in / ~0.2K out"
              cost="~$0.01"
              note='"make it glow more", "slow it down"'
            />
            <CostRow
              action="Edit whole scene"
              tokens="~3K in / ~1K out"
              cost="~$0.02"
              note='"darken the mood", "add a violet orb"'
            />
            <CostRow
              action="Apply doodle (3 strokes)"
              tokens="~3.5K in / ~1.5K out"
              cost="~$0.03"
              note="Swirl, scribble, place — applied together."
            />
          </div>
        </div>

        {/* Realistic project totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tier
            name="One polished site"
            cost="~$0.50 – $1.50"
            color="emerald"
            details={[
              "1–3 generate calls",
              "10–20 edits",
              "5–15 doodles",
            ]}
            footnote="Anthropic's $5 free credit covers 3–10 of these."
          />
          <Tier
            name="Heavy iteration"
            cost="~$3 – $8"
            color="cyan"
            details={[
              "Lots of regenerations",
              "50+ tweaks",
              "Multi-scene experimentation",
            ]}
            footnote="A serious build day."
          />
          <Tier
            name="Production traffic"
            cost="$0 / month"
            color="violet"
            details={[
              "Engine runs in the browser",
              "No server-side rendering on every visit",
              "API calls only happen when authoring",
            ]}
            footnote="Visitors don't cost you tokens."
          />
        </div>

        {/* When does money kick in */}
        <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-amber-500/8 to-rose-500/4 p-6 md:p-8 space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-200/70">
            When you actually start spending
          </div>
          <ol className="space-y-2.5 text-sm md:text-base text-white/75 leading-relaxed">
            <li>
              <span className="font-mono text-amber-200/80">1.</span> The
              moment you add an{" "}
              <span className="font-mono">ANTHROPIC_API_KEY</span> and click a
              prompt button — but Anthropic gives new accounts $5 free.
            </li>
            <li>
              <span className="font-mono text-amber-200/80">2.</span> Past
              that, only when you use it. Pay-per-call. No floor.
            </li>
            <li>
              <span className="font-mono text-amber-200/80">3.</span> Vercel
              hosting stays free until heavy traffic, custom domains, or team
              seats.
            </li>
            <li>
              <span className="font-mono text-amber-200/80">4.</span> You can
              swap to{" "}
              <span className="font-mono text-cyan-200/80">
                gpt-4o-mini
              </span>{" "}
              or{" "}
              <span className="font-mono text-cyan-200/80">
                gemini-flash
              </span>{" "}
              and cut per-call cost ~5×, or run a local model and pay $0 per
              call.
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function CostRow({
  action,
  tokens,
  cost,
  note,
}: {
  action: string;
  tokens: string;
  cost: string;
  note: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
      <div className="md:col-span-4 text-sm text-white/85 font-medium">
        {action}
      </div>
      <div className="md:col-span-3 text-[11px] font-mono text-white/35">
        {tokens}
      </div>
      <div className="md:col-span-2 text-sm font-mono text-amber-200/90">
        {cost}
      </div>
      <div className="md:col-span-3 text-[12px] text-white/45 font-light leading-snug">
        {note}
      </div>
    </div>
  );
}

function Tier({
  name,
  cost,
  details,
  footnote,
  color,
}: {
  name: string;
  cost: string;
  details: string[];
  footnote: string;
  color: "emerald" | "cyan" | "violet";
}) {
  const accent =
    color === "emerald"
      ? "text-emerald-200/85 from-emerald-400/30"
      : color === "cyan"
        ? "text-cyan-200/85 from-cyan-400/30"
        : "text-violet-200/85 from-violet-400/30";
  return (
    <div className="relative rounded-3xl border border-white/8 bg-white/[0.02] p-6 overflow-hidden">
      <div
        className={`absolute inset-x-0 -top-px h-px bg-gradient-to-r ${accent} to-transparent opacity-70`}
      />
      <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">
        {name}
      </div>
      <div
        className={`mt-3 text-3xl font-bold tracking-[-0.02em] ${accent.split(" ")[0]}`}
      >
        {cost}
      </div>
      <ul className="mt-4 space-y-1.5 text-[12px] text-white/55 font-light">
        {details.map((d) => (
          <li key={d} className="flex gap-2">
            <span className="text-white/25">·</span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-white/5 text-[11px] font-mono text-white/35 leading-snug">
        {footnote}
      </div>
    </div>
  );
}
