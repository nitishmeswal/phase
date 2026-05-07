import type {
  AnimationBehaviour,
  CameraKeyframe,
  GeometryKind,
  MaterialPreset,
  SceneDefinition,
  SceneObject,
} from "./types";
import { GEOMETRY_KINDS, MATERIAL_PRESETS } from "./schema";

/**
 * Defensive validators that turn untrusted JSON (from the AI layer or
 * localStorage) into clamped, runtime-safe SceneDefinition values.
 *
 * Anything missing or out-of-range is replaced with a safe default
 * rather than throwing, so a partially-valid model response still
 * renders something coherent.
 */

const GEOMETRY_SET: ReadonlySet<string> = new Set(GEOMETRY_KINDS);
const MATERIAL_SET: ReadonlySet<string> = new Set(MATERIAL_PRESETS);

function num(v: unknown, fallback: number, min?: number, max?: number): number {
  let n =
    typeof v === "number" && Number.isFinite(v)
      ? v
      : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))
        ? Number(v)
        : fallback;
  if (min != null) n = Math.max(min, n);
  if (max != null) n = Math.min(max, n);
  return n;
}

function vec3(
  v: unknown,
  fallback: [number, number, number],
  min = -10,
  max = 10,
): [number, number, number] {
  if (!Array.isArray(v)) return fallback;
  return [
    num(v[0], fallback[0], min, max),
    num(v[1], fallback[1], min, max),
    num(v[2], fallback[2], min, max),
  ];
}

function geom(v: unknown, fallback: GeometryKind = "box"): GeometryKind {
  return typeof v === "string" && GEOMETRY_SET.has(v)
    ? (v as GeometryKind)
    : fallback;
}

function mat(v: unknown, fallback: MaterialPreset = "chrome"): MaterialPreset {
  return typeof v === "string" && MATERIAL_SET.has(v)
    ? (v as MaterialPreset)
    : fallback;
}

function hex(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const trimmed = v.trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)
    ? trimmed
    : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() !== "" ? v : fallback;
}

function id(v: unknown, fallback: string): string {
  if (typeof v !== "string" || v.trim() === "") return fallback;
  return v
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function animation(v: unknown): AnimationBehaviour {
  if (!v || typeof v !== "object") return {};
  const a = v as Record<string, unknown>;
  const out: AnimationBehaviour = {};
  if (a.breathe) out.breathe = true;
  if (a.pulse) out.pulse = true;
  if (a.float) out.float = true;
  if (a.squashStretch) out.squashStretch = true;
  if (a.wobble) out.wobble = true;
  if (a.spin && typeof a.spin === "object") {
    const s = a.spin as Record<string, unknown>;
    const axis = s.axis === "x" || s.axis === "y" || s.axis === "z" ? s.axis : "y";
    out.spin = { axis, speed: num(s.speed, 0.2, -2, 2) };
  }
  return out;
}

function camera(v: unknown, fallback: CameraKeyframe): CameraKeyframe {
  if (!v || typeof v !== "object") return fallback;
  const k = v as Record<string, unknown>;
  return {
    position: vec3(k.position, fallback.position, -20, 20),
    lookAt: vec3(k.lookAt, fallback.lookAt, -10, 10),
    fov: num(k.fov, fallback.fov ?? 40, 16, 80),
  };
}

export function validateObject(
  v: unknown,
  fallbackId = "object",
): SceneObject {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    id: id(o.id, fallbackId),
    label: str(o.label, "Untitled object"),
    geometry: geom(o.geometry, "box"),
    material: mat(o.material, "chrome"),
    position: vec3(o.position, [0, 0, 0], -6, 6),
    rotation: vec3(o.rotation, [0, 0, 0], -Math.PI * 2, Math.PI * 2),
    scale: vec3(o.scale, [1, 1, 1], 0.05, 4),
    color: hex(o.color, "#9adfff"),
    opacity: num(o.opacity, 1, 0, 1),
    animation: animation(o.animation),
    morphTo:
      typeof o.morphTo === "string" && GEOMETRY_SET.has(o.morphTo)
        ? (o.morphTo as GeometryKind)
        : undefined,
    visible: bool(o.visible, true),
  };
}

export function validateScene(
  v: unknown,
  fallbackId = "scene",
): SceneDefinition {
  const s = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;

  const fallbackCamera: { start: CameraKeyframe; end: CameraKeyframe } = {
    start: { position: [0, 0.6, 6], lookAt: [0, 0, 0], fov: 40 },
    end: { position: [0, 0.4, 5], lookAt: [0, 0, 0], fov: 36 },
  };

  const cameraVal =
    s.camera && typeof s.camera === "object"
      ? (s.camera as Record<string, unknown>)
      : {};

  const objs = Array.isArray(s.objects) ? s.objects : [];
  const seenIds = new Set<string>();
  const objects: SceneObject[] = objs.slice(0, 12).map((raw, i) => {
    let o = validateObject(raw, `object-${i + 1}`);
    let next = o.id;
    let n = 1;
    while (seenIds.has(next)) {
      next = `${o.id}-${n++}`;
    }
    if (next !== o.id) o = { ...o, id: next };
    seenIds.add(next);
    return o;
  });

  const out: SceneDefinition = {
    id: id(s.id, fallbackId),
    label: str(s.label, "Untitled scene"),
    description: str(s.description, "A cinematic graybox scene."),
    duration: num(s.duration, 160, 60, 320),
    background: hex(s.background, "#03040a"),
    camera: {
      start: camera(cameraVal.start, fallbackCamera.start),
      end: camera(cameraVal.end, fallbackCamera.end),
    },
    objects,
  };

  if (s.fog && typeof s.fog === "object") {
    const f = s.fog as Record<string, unknown>;
    out.fog = {
      color: hex(f.color, out.background),
      near: num(f.near, 7, 0.5, 30),
      far: num(f.far, 22, 5, 80),
    };
  }

  if (s.postprocessing && typeof s.postprocessing === "object") {
    const pp = s.postprocessing as Record<string, unknown>;
    const post: NonNullable<SceneDefinition["postprocessing"]> = {};
    if (pp.bloom && typeof pp.bloom === "object") {
      const b = pp.bloom as Record<string, unknown>;
      post.bloom = {
        intensity: num(b.intensity, 1.2, 0, 4),
        luminanceThreshold: num(b.luminanceThreshold, 0.15, 0, 1),
      };
    }
    if (pp.vignette && typeof pp.vignette === "object") {
      const v2 = pp.vignette as Record<string, unknown>;
      post.vignette = { darkness: num(v2.darkness, 0.7, 0, 1) };
    }
    if (pp.chromaticAberration && typeof pp.chromaticAberration === "object") {
      const c = pp.chromaticAberration as Record<string, unknown>;
      post.chromaticAberration = { offset: num(c.offset, 0.0008, 0, 0.01) };
    }
    if (Object.keys(post).length > 0) out.postprocessing = post;
  } else {
    out.postprocessing = {
      bloom: { intensity: 1.2, luminanceThreshold: 0.15 },
      vignette: { darkness: 0.75 },
      chromaticAberration: { offset: 0.0008 },
    };
  }

  return out;
}

export function validateScenes(v: unknown): SceneDefinition[] {
  const arr = Array.isArray(v) ? v : v ? [v] : [];
  const seen = new Set<string>();
  const out: SceneDefinition[] = [];
  arr.slice(0, 8).forEach((raw, i) => {
    let s = validateScene(raw, `scene-${i + 1}`);
    let next = s.id;
    let n = 1;
    while (seen.has(next)) {
      next = `${s.id}-${n++}`;
    }
    if (next !== s.id) s = { ...s, id: next };
    seen.add(next);
    out.push(s);
  });
  return out;
}
