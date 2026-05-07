/**
 * Doodle layer — a 2D drawing surface that the AI interprets as
 * scene-graph choreography.
 *
 * Strokes are normalized to viewport-space coordinates so the renderer
 * (and the AI) can map them into 3D scene space without caring about
 * pixel resolution or aspect ratio.
 *
 *   x_norm: -2.5 .. +2.5   (left .. right, matches scene X budget)
 *   y_norm: -1.5 .. +1.5   (bottom .. top,  Y is flipped from CSS)
 *
 * The drawing surface decides aspect ratio internally; the rest of the
 * pipeline only sees normalized points.
 */

import type { GeometryKind } from "./types";

export const DOODLE_TOOLS = [
  "path",
  "swirl",
  "glow",
  "pulse",
  "burst",
  "place",
  "morph",
  "erase",
] as const;

export type DoodleTool = (typeof DOODLE_TOOLS)[number];

export interface DoodleStroke {
  id: string;
  tool: DoodleTool;
  /** Normalized [-2.5, 2.5] x [-1.5, 1.5] points (Y up). */
  points: [number, number][];
  /** Hex color of the stroke ink (visual hint, also used for materials). */
  color: string;
  /** For "place" strokes, what proxy geometry the AI should drop. */
  placeShape?: GeometryKind;
  /** For "morph" strokes, the geometry the connected target should morph into. */
  morphTo?: GeometryKind;
  createdAt: number;
}

export interface DoodleToolMeta {
  id: DoodleTool;
  label: string;
  symbol: string;
  hint: string;
  /** Default ink color (CSS hex). */
  color: string;
}

export const DOODLE_TOOL_META: Record<DoodleTool, DoodleToolMeta> = {
  path: {
    id: "path",
    label: "Path",
    symbol: "↝",
    hint: "Draw a curve. Object drifts along it.",
    color: "#61f6ff",
  },
  swirl: {
    id: "swirl",
    label: "Swirl",
    symbol: "◌",
    hint: "Draw a spiral. Adds spin / orbit.",
    color: "#a985ff",
  },
  glow: {
    id: "glow",
    label: "Glow",
    symbol: "✦",
    hint: "Scribble a region. Objects there glow.",
    color: "#ffd166",
  },
  pulse: {
    id: "pulse",
    label: "Pulse",
    symbol: "◉",
    hint: "Circle a region. Objects there pulse + breathe.",
    color: "#ff6ec7",
  },
  burst: {
    id: "burst",
    label: "Burst",
    symbol: "✷",
    hint: "Cross-mark a point. Scatters small shapes.",
    color: "#ff9a3d",
  },
  place: {
    id: "place",
    label: "Place",
    symbol: "◆",
    hint: "Tap to drop a new object.",
    color: "#9adfff",
  },
  morph: {
    id: "morph",
    label: "Morph",
    symbol: "→",
    hint: "Line between two objects. First morphs into second.",
    color: "#7cffd0",
  },
  erase: {
    id: "erase",
    label: "Erase",
    symbol: "✕",
    hint: "Cross-out an object to remove it.",
    color: "#ff5c8a",
  },
};

export const PLACEABLE_SHAPES: GeometryKind[] = [
  "box",
  "sphere",
  "torus",
  "torusKnot",
  "icosahedron",
  "octahedron",
  "capsule",
  "cone",
];

/**
 * Convert a CSS-pixel point inside `rect` to normalized scene coords.
 */
export function pixelToNormalized(
  px: number,
  py: number,
  rect: { left: number; top: number; width: number; height: number },
): [number, number] {
  const xRel = (px - rect.left) / Math.max(rect.width, 1); // 0..1
  const yRel = (py - rect.top) / Math.max(rect.height, 1); // 0..1
  // Map x: 0->-2.5, 1->+2.5; y: 0->+1.5 (top), 1->-1.5 (bottom)
  return [xRel * 5 - 2.5, 1.5 - yRel * 3];
}

/**
 * Inverse: normalized scene coord back to CSS pixels for rendering the
 * stroke on top of the canvas.
 */
export function normalizedToPixel(
  nx: number,
  ny: number,
  rect: { width: number; height: number },
): [number, number] {
  return [
    ((nx + 2.5) / 5) * rect.width,
    ((1.5 - ny) / 3) * rect.height,
  ];
}

/** Reduce a noisy raw stroke down to a smaller path the AI can reason about. */
export function simplifyStroke(
  points: [number, number][],
  maxPoints = 32,
): [number, number][] {
  if (points.length <= maxPoints) return points;
  const out: [number, number][] = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    out.push(points[Math.round(i * step)]);
  }
  return out;
}

/**
 * Centroid of a stroke (in normalized coords).
 */
export function strokeCentroid(stroke: DoodleStroke): [number, number] {
  if (stroke.points.length === 0) return [0, 0];
  let sx = 0;
  let sy = 0;
  for (const [x, y] of stroke.points) {
    sx += x;
    sy += y;
  }
  return [sx / stroke.points.length, sy / stroke.points.length];
}

/** Bounding box (in normalized coords) of a stroke. */
export function strokeBounds(stroke: DoodleStroke): {
  min: [number, number];
  max: [number, number];
} {
  if (stroke.points.length === 0) {
    return { min: [0, 0], max: [0, 0] };
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [x, y] of stroke.points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { min: [minX, minY], max: [maxX, maxY] };
}
