import { NextResponse } from "next/server";
import {
  AnthropicError,
  callClaude,
  parseJsonFromModel,
} from "@/lib/anthropic";
import { SCENE_SCHEMA_PROMPT } from "@/engine/schema";
import { validateScene } from "@/engine/validate";
import type { SceneDefinition } from "@/engine/types";
import {
  DOODLE_TOOLS,
  DOODLE_TOOL_META,
  type DoodleStroke,
  simplifyStroke,
  strokeBounds,
  strokeCentroid,
} from "@/engine/doodle";

export const runtime = "nodejs";

interface Body {
  scene?: SceneDefinition;
  strokes?: DoodleStroke[];
  /** Optional plain-English note to bias interpretation. */
  prompt?: string;
}

const SYSTEM = `${SCENE_SCHEMA_PROMPT}

The user is directing a 3D cinematic scene by DRAWING on top of the live
viewport. They have a brush toolbox where each brush has a different
animation intent. Your job: read the strokes and patch the scene graph
so it OBEYS what the user drew.

Coordinate system the user is drawing in:
- All stroke points are pre-normalized to scene-space.
- x in [-2.5, +2.5]  (left .. right)
- y in [-1.5, +1.5]  (bottom .. top, +Y is up)
- The scene's z is implicit (default 0).

Brush vocabulary (every stroke has a "tool" — interpret accordingly):

- "path"   The points trace where an object should travel. Take the
           bounds: place a NEW SceneObject near the stroke's centroid
           if the user has no clear target object near it; bias its
           rotation/animation so it visually matches the curve. Add
           "float" and a gentle "spin". Use the path's overall direction
           (down, up, diagonal) to set the camera mood (descending arc =
           cinematic top-down). NEVER literally encode keyframes — Phase
           does not support per-object position keyframes yet; the path
           is a HINT for placement and motion personality.

- "swirl"  A circular / spiral stroke. Means "this region should spin or
           orbit". Either: (a) add spin animation to the closest existing
           object, axis chosen from the spiral's plane (most strokes are
           XY so axis="z"); (b) add a NEW orbiting torusKnot at the
           centroid with material=hologram and a fast spin.

- "glow"   A scribble over an area. Convert the closest existing objects
           in that bounds to material="glow" or "emissive", brighten the
           color toward the stroke's color, and raise postprocessing.bloom.intensity.
           If no object lies in the bounds, drop a small glow sphere at the centroid.

- "pulse"  A circle / throb. Add { breathe: true, pulse: true } to objects
           in the bounds. If empty, drop a glow icosahedron at the centroid
           with breathing pulse.

- "burst"  An X / star / radial mark. Scatter 3-5 small ambient SceneObjects
           around the centroid (sphere/octahedron, glass material, low
           opacity, with pulse + wobble), at radius 0.6-1.4.

- "place"  A short / dot stroke. Drop ONE new SceneObject at the centroid
           using the stroke's "placeShape" geometry (default sphere) with
           sensible material (glow if color is bright, chrome otherwise),
           a gentle breathe animation, and a unique id.

- "morph"  A line connecting two regions. Find the existing object closest
           to the START of the stroke. Set its morphTo to the stroke's
           "morphTo" geometry (or the geometry of the object closest to the
           END of the stroke if obvious). Add a gentle spin to make the
           morph feel intentional under scroll.

- "erase"  A cross-out / scribble through an object. Find the existing
           object closest to the stroke's centroid and REMOVE it from
           objects[]. If no object is near, do nothing.

General rules:
- Compose multiple strokes in ORDER given. Apply each stroke's effect.
- Preserve scene.id.
- Preserve existing objects unless an "erase" stroke targets them.
- Always return the FULL updated SceneDefinition.
- Stay within the dark cinematic palette unless the doodle ink color
  clearly says otherwise (then nudge the closest object's color toward
  the ink color).

Return ONLY one JSON object: the full updated SceneDefinition.`;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const scene = body.scene;
  const strokes = body.strokes ?? [];
  const note = (body.prompt ?? "").trim();

  if (!scene || typeof scene !== "object" || !scene.id) {
    return NextResponse.json(
      { error: "scene (SceneDefinition) is required" },
      { status: 400 },
    );
  }
  if (!Array.isArray(strokes) || strokes.length === 0) {
    return NextResponse.json(
      { error: "strokes is required (non-empty array)" },
      { status: 400 },
    );
  }

  // Pre-digest: simplify strokes, attach summary metadata so the model
  // can reason without parsing huge polylines.
  const condensed = strokes
    .filter(
      (s): s is DoodleStroke =>
        s != null &&
        typeof s === "object" &&
        DOODLE_TOOLS.includes(s.tool) &&
        Array.isArray(s.points) &&
        s.points.length > 0,
    )
    .map((s) => {
      const points = simplifyStroke(s.points, 24);
      const reduced: DoodleStroke = { ...s, points };
      const c = strokeCentroid(reduced);
      const b = strokeBounds(reduced);
      return {
        ...reduced,
        toolMeta: DOODLE_TOOL_META[s.tool],
        centroid: { x: +c[0].toFixed(2), y: +c[1].toFixed(2) },
        bounds: {
          min: { x: +b.min[0].toFixed(2), y: +b.min[1].toFixed(2) },
          max: { x: +b.max[0].toFixed(2), y: +b.max[1].toFixed(2) },
        },
      };
    });

  if (condensed.length === 0) {
    return NextResponse.json(
      { error: "No valid strokes to interpret" },
      { status: 400 },
    );
  }

  const userMsg = `currentScene:
${JSON.stringify(scene)}

doodleStrokes:
${JSON.stringify(condensed)}
${note ? `\nuserNote: """${note}"""\n` : ""}
Apply each stroke in order. Return the FULL updated SceneDefinition as JSON. Preserve "id".`;

  try {
    const raw = await callClaude({
      system: SYSTEM,
      user: userMsg,
      assistantPrefill: "{",
      temperature: 0.5,
      maxTokens: 4000,
    });
    const parsed = parseJsonFromModel<unknown>(raw);
    const validated = validateScene(parsed, scene.id);
    const next: SceneDefinition = { ...validated, id: scene.id };
    return NextResponse.json({ scene: next });
  } catch (err) {
    const status = err instanceof AnthropicError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status },
    );
  }
}
