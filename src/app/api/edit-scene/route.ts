import { NextResponse } from "next/server";
import {
  AnthropicError,
  callClaude,
  parseJsonFromModel,
} from "@/lib/anthropic";
import { SCENE_SCHEMA_PROMPT } from "@/engine/schema";
import { validateScene } from "@/engine/validate";
import type { SceneDefinition } from "@/engine/types";

export const runtime = "nodejs";

interface Body {
  scene?: SceneDefinition;
  prompt?: string;
}

const SYSTEM = `${SCENE_SCHEMA_PROMPT}

You are revising one cinematic scene to obey a natural-language direction.

You will receive:
- "currentScene": the current SceneDefinition JSON
- "instruction": a short visual direction in plain English (it can affect any
  number of objects, the camera, the post-processing, the duration, etc.)

Output ONE JSON object: the FULL UPDATED SceneDefinition (same id) with the
requested change applied. Preserve everything else.

Examples of directions and what they mean:
- "add a glowing orb behind the main object" -> append a SceneObject (sphere,
  material=glow, position with negative Z).
- "make the camera push in slower" -> bring camera.end closer to camera.start.
- "darken the mood" -> lower bloom intensity, raise vignette darkness, deepen
  background color.
- "remove the wireframe shard" -> drop that object from objects[].
- "extend the scene" -> raise duration by 30-60.

Return ONLY the JSON object.`;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const scene = body.scene;
  const instruction = (body.prompt ?? "").trim();

  if (!scene || typeof scene !== "object" || !scene.id) {
    return NextResponse.json(
      { error: "scene (SceneDefinition) is required" },
      { status: 400 },
    );
  }
  if (!instruction) {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 },
    );
  }

  const userMsg = `currentScene:
${JSON.stringify(scene)}

instruction:
"""
${instruction}
"""

Return the FULL updated SceneDefinition as JSON. Preserve "id".`;

  try {
    const raw = await callClaude({
      system: SYSTEM,
      user: userMsg,
      assistantPrefill: "{",
      temperature: 0.6,
      maxTokens: 3500,
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
