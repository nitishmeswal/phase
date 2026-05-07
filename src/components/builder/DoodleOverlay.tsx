"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEngine } from "@/engine/store";
import {
  DOODLE_TOOL_META,
  DOODLE_TOOLS,
  PLACEABLE_SHAPES,
  type DoodleStroke,
  type DoodleTool,
  pixelToNormalized,
  normalizedToPixel,
} from "@/engine/doodle";
import type { GeometryKind, SceneDefinition } from "@/engine/types";

const STROKE_THICKNESS: Record<DoodleTool, number> = {
  path: 2.5,
  swirl: 2.5,
  glow: 9,
  pulse: 4,
  burst: 3,
  place: 0,
  morph: 3,
  erase: 6,
};

function makeId() {
  return `doodle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function DoodleOverlay() {
  const enabled = useEngine((s) => s.doodle.enabled);
  const tool = useEngine((s) => s.doodle.tool);
  const placeShape = useEngine((s) => s.doodle.placeShape);
  const morphTarget = useEngine((s) => s.doodle.morphTarget);
  const strokes = useEngine((s) => s.doodle.strokes);
  const pending = useEngine((s) => s.doodle.pending);

  const setDoodlePending = useEngine((s) => s.setDoodlePending);
  const commitDoodleStroke = useEngine((s) => s.commitDoodleStroke);
  const undoDoodleStroke = useEngine((s) => s.undoDoodleStroke);
  const clearDoodle = useEngine((s) => s.clearDoodle);
  const toggleDoodle = useEngine((s) => s.toggleDoodle);

  const scenes = useEngine((s) => s.scenes);
  const currentSceneIndex = useEngine((s) => s.currentSceneIndex);
  const replaceScene = useEngine((s) => s.replaceScene);

  const status = useEngine((s) => s.builder.status);
  const setBuilderStatus = useEngine((s) => s.setBuilderStatus);
  const setBuilderError = useEngine((s) => s.setBuilderError);
  const setToast = useEngine((s) => s.setToast);
  const llmProvider = useEngine((s) => s.llm.provider);
  const llmModel = useEngine((s) => s.llm.model);

  const svgRef = useRef<SVGSVGElement>(null);
  const drawingRef = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [note, setNote] = useState("");

  // Track viewport size so the SVG fills the screen and pixel<->norm maps are right.
  useEffect(() => {
    if (!enabled) return;
    function update() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [enabled]);

  // Hotkeys.
  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "Escape") toggleDoodle();
      else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undoDoodleStroke();
      } else {
        // 1..8 select brushes in declared order.
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < DOODLE_TOOLS.length) {
          useEngine.getState().setDoodleTool(DOODLE_TOOLS[idx]);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, toggleDoodle, undoDoodleStroke]);

  const getRect = useCallback(() => {
    const el = svgRef.current;
    if (!el) return null;
    return el.getBoundingClientRect();
  }, []);

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (!enabled || status === "editing" || status === "generating") return;
    const rect = getRect();
    if (!rect) return;

    const [nx, ny] = pixelToNormalized(e.clientX, e.clientY, rect);
    const stroke: DoodleStroke = {
      id: makeId(),
      tool,
      points: [[nx, ny]],
      color: DOODLE_TOOL_META[tool].color,
      placeShape: tool === "place" ? placeShape : undefined,
      morphTo: tool === "morph" ? morphTarget : undefined,
      createdAt: Date.now(),
    };

    drawingRef.current = true;
    svgRef.current?.setPointerCapture(e.pointerId);

    if (tool === "place") {
      // Place strokes are 1-point taps — commit immediately.
      commitDoodleStroke(stroke);
      drawingRef.current = false;
      return;
    }
    setDoodlePending(stroke);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!enabled || !drawingRef.current || !pending) return;
    const rect = getRect();
    if (!rect) return;
    const [nx, ny] = pixelToNormalized(e.clientX, e.clientY, rect);
    setDoodlePending({
      ...pending,
      points: [...pending.points, [nx, ny]],
    });
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (!enabled || !drawingRef.current) return;
    drawingRef.current = false;
    svgRef.current?.releasePointerCapture(e.pointerId);
    if (pending && pending.points.length >= 2) {
      commitDoodleStroke(pending);
    } else {
      setDoodlePending(null);
    }
  }

  async function applyDoodle() {
    const scene = scenes[currentSceneIndex];
    if (!scene) {
      setToast("No scene to direct.");
      return;
    }
    if (strokes.length === 0) {
      setToast("Draw something first.");
      return;
    }
    if (status === "editing" || status === "generating") return;

    setBuilderStatus("editing");
    setBuilderError(null);

    try {
      const res = await fetch("/api/apply-doodle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scene,
          strokes,
          prompt: note.trim() || undefined,
          provider: llmProvider,
          model: llmModel ?? undefined,
        }),
      });
      const json = (await res.json()) as {
        scene?: SceneDefinition;
        error?: string;
      };
      if (!res.ok || !json.scene) {
        throw new Error(json.error || `Request failed (${res.status})`);
      }
      replaceScene(scene.id, json.scene);
      clearDoodle();
      setNote("");
      setBuilderStatus("idle");
      setToast(`Doodle applied — scene "${json.scene.label}" updated.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setBuilderError(msg);
      setBuilderStatus("error");
      setToast(`Doodle failed: ${msg}`);
    }
  }

  if (!enabled) return null;

  const allStrokes = pending ? [...strokes, pending] : strokes;
  const busy = status === "editing" || status === "generating";

  return (
    <>
      {/* SVG drawing surface */}
      <svg
        ref={svgRef}
        className="fixed inset-0 z-40 cursor-crosshair touch-none"
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${Math.max(size.width, 1)} ${Math.max(size.height, 1)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* subtle dimming + grid so users feel they are in "draw mode" */}
        <rect
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fill="rgba(2, 4, 12, 0.18)"
        />

        {allStrokes.map((s) => (
          <DoodleStrokeSvg key={s.id} stroke={s} size={size} />
        ))}
      </svg>

      <DoodleToolbar />

      <DoodleActionBar
        note={note}
        setNote={setNote}
        applyDoodle={applyDoodle}
        busy={busy}
        strokeCount={strokes.length}
      />
    </>
  );
}

function DoodleStrokeSvg({
  stroke,
  size,
}: {
  stroke: DoodleStroke;
  size: { width: number; height: number };
}) {
  if (stroke.points.length === 0) return null;
  const meta = DOODLE_TOOL_META[stroke.tool];
  const thickness = STROKE_THICKNESS[stroke.tool];

  // Place strokes render as a glyph dot, not a polyline.
  if (stroke.tool === "place") {
    const [px, py] = normalizedToPixel(stroke.points[0][0], stroke.points[0][1], size);
    return (
      <g>
        <circle cx={px} cy={py} r={14} fill={`${meta.color}33`} />
        <circle
          cx={px}
          cy={py}
          r={6}
          fill={meta.color}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={1.5}
        />
        <text
          x={px}
          y={py - 18}
          fill={meta.color}
          fontSize="10"
          fontFamily="monospace"
          textAnchor="middle"
          opacity={0.85}
        >
          {(stroke.placeShape ?? "sphere").toUpperCase()}
        </text>
      </g>
    );
  }

  const d = stroke.points
    .map(([nx, ny], i) => {
      const [px, py] = normalizedToPixel(nx, ny, size);
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(" ");

  const opacity = stroke.tool === "glow" ? 0.55 : 0.95;

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={meta.color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        style={
          stroke.tool === "glow"
            ? { filter: `drop-shadow(0 0 8px ${meta.color})` }
            : undefined
        }
      />
      {/* Small symbol at end of stroke so the user can see what they drew. */}
      {(() => {
        const last = stroke.points[stroke.points.length - 1];
        const [px, py] = normalizedToPixel(last[0], last[1], size);
        return (
          <text
            x={px + 10}
            y={py - 8}
            fill={meta.color}
            fontSize="14"
            opacity={0.7}
          >
            {meta.symbol}
          </text>
        );
      })()}
    </g>
  );
}

function DoodleToolbar() {
  const tool = useEngine((s) => s.doodle.tool);
  const placeShape = useEngine((s) => s.doodle.placeShape);
  const morphTarget = useEngine((s) => s.doodle.morphTarget);
  const setDoodleTool = useEngine((s) => s.setDoodleTool);
  const setDoodlePlaceShape = useEngine((s) => s.setDoodlePlaceShape);
  const setDoodleMorphTarget = useEngine((s) => s.setDoodleMorphTarget);
  const toggleDoodle = useEngine((s) => s.toggleDoodle);

  const meta = DOODLE_TOOL_META[tool];

  return (
    <div className="fixed top-1/2 -translate-y-1/2 left-4 z-50 space-y-2">
      <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-2 space-y-1 shadow-2xl">
        <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/30 px-2 pt-1 pb-2">
          Brushes
        </div>
        {DOODLE_TOOLS.map((t, i) => {
          const m = DOODLE_TOOL_META[t];
          const active = t === tool;
          return (
            <button
              key={t}
              onClick={() => setDoodleTool(t)}
              className={`group flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 transition-all border ${
                active
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-transparent hover:bg-white/5 text-white/55 hover:text-white"
              }`}
              title={m.hint}
              style={active ? { boxShadow: `0 0 18px ${m.color}33` } : undefined}
            >
              <span
                className="text-base w-5 text-center"
                style={{ color: m.color }}
              >
                {m.symbol}
              </span>
              <span className="text-[10px] font-mono tracking-wider uppercase">
                {m.label}
              </span>
              <span className="ml-auto text-[9px] font-mono text-white/25">
                {i + 1}
              </span>
            </button>
          );
        })}
        <div className="border-t border-white/5 mt-2 pt-2 px-2">
          <button
            onClick={toggleDoodle}
            className="w-full text-[10px] font-mono uppercase tracking-widest text-white/45 hover:text-white py-1 transition-colors"
          >
            ✕ Exit doodle
          </button>
        </div>
      </div>

      {/* Tool-specific options */}
      {tool === "place" && (
        <ShapePicker
          label="Place shape"
          value={placeShape}
          onChange={setDoodlePlaceShape}
          color={meta.color}
        />
      )}
      {tool === "morph" && (
        <ShapePicker
          label="Morph target"
          value={morphTarget}
          onChange={setDoodleMorphTarget}
          color={meta.color}
        />
      )}
    </div>
  );
}

function ShapePicker({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: GeometryKind;
  onChange: (s: GeometryKind) => void;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-2 shadow-2xl">
      <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/30 px-2 pt-1 pb-2">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-1 max-w-[180px]">
        {PLACEABLE_SHAPES.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`text-[10px] font-mono px-2 py-1.5 rounded-lg border transition-all ${
              value === s
                ? "bg-white/10 border-white/20 text-white"
                : "border-transparent text-white/45 hover:text-white hover:bg-white/5"
            }`}
            style={value === s ? { boxShadow: `0 0 12px ${color}33` } : undefined}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function DoodleActionBar({
  note,
  setNote,
  applyDoodle,
  busy,
  strokeCount,
}: {
  note: string;
  setNote: (s: string) => void;
  applyDoodle: () => void;
  busy: boolean;
  strokeCount: number;
}) {
  const undoDoodleStroke = useEngine((s) => s.undoDoodleStroke);
  const clearDoodle = useEngine((s) => s.clearDoodle);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="rounded-2xl border border-cyan-300/30 bg-black/75 backdrop-blur-xl p-3 shadow-[0_0_30px_rgba(110,200,255,0.18)] flex items-center gap-3">
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/50">
          <span className="text-cyan-300">◆</span>
          <span className="tracking-widest uppercase">DOODLE</span>
          <span className="text-white/30">·</span>
          <span>{strokeCount} stroke{strokeCount === 1 ? "" : "s"}</span>
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional hint: 'make it cinematic'…"
          disabled={busy}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/25 font-mono focus:outline-none focus:border-cyan-300/40 transition-colors"
        />

        <div className="flex items-center gap-1">
          <button
            onClick={undoDoodleStroke}
            disabled={busy || strokeCount === 0}
            className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Undo last stroke (⌘Z)"
          >
            ↶ UNDO
          </button>
          <button
            onClick={clearDoodle}
            disabled={busy || strokeCount === 0}
            className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            CLEAR
          </button>
          <button
            onClick={applyDoodle}
            disabled={busy || strokeCount === 0}
            className="text-[10px] font-mono uppercase tracking-[0.18em] px-4 py-1.5 rounded-lg border bg-cyan-300/15 hover:bg-cyan-300/25 border-cyan-300/40 text-cyan-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {busy ? "Directing…" : "▶ Apply doodle"}
          </button>
        </div>
      </div>
    </div>
  );
}
