import { NextResponse } from "next/server";
import {
  LLMError,
  callLLM,
  parseJsonFromModel,
  type ProviderId,
} from "@/lib/llm";
import { SCENE_SCHEMA_PROMPT } from "@/engine/schema";
import { validateObject } from "@/engine/validate";
import type { SceneObject } from "@/engine/types";

export const runtime = "nodejs";

interface Body {
  object?: SceneObject;
  prompt?: string;
  sceneLabel?: string;
  provider?: ProviderId;
  model?: string;
}

const SYSTEM = `${SCENE_SCHEMA_PROMPT}

You are acting as a visual director making ONE SceneObject obey a natural-language correction.

You will receive:
- "currentObject": the current SceneObject JSON
- "instruction": a short visual direction in plain English

Output ONE JSON object: the FULL UPDATED SceneObject (same id) with the
requested change applied. Keep all unchanged fields exactly as they were.

Common direction patterns to interpret correctly:
- "slow this down"  -> reduce spin.speed, drop pulse / breathe frequency
  (we can't change frequency directly but you can disable pulse if it's
  already too aggressive).
- "make it glow more" -> set material to "glow" or "emissive", raise opacity.
- "more chrome / more metal" -> material = "chrome".
- "make it crack / make it like glass" -> material = "glass" or "wireframe".
- "morph into X" -> set morphTo = X if X is a valid GeometryKind.
- "move left/right/up/down" -> shift position.x or position.y by 0.4-0.8.
- "bigger / smaller" -> scale by 1.25 or 0.8.
- "make it alive / hop" -> animation.squashStretch = true, animation.float = true.
- "calmer / steadier" -> animation.breathe = false, animation.pulse = false.
- "rotate faster / slower" -> animation.spin.speed *= 1.5 or 0.6.

Return ONLY the JSON object — no markdown, no commentary.`;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const obj = body.object;
  const instruction = (body.prompt ?? "").trim();

  if (!obj || typeof obj !== "object" || !obj.id) {
    return NextResponse.json(
      { error: "object (SceneObject) is required" },
      { status: 400 },
    );
  }
  if (!instruction) {
    return NextResponse.json(
      { error: "prompt (visual direction) is required" },
      { status: 400 },
    );
  }
  if (instruction.length > 1000) {
    return NextResponse.json(
      { error: "prompt too long (max 1000 chars)" },
      { status: 400 },
    );
  }

  const userMsg = `Scene context: ${body.sceneLabel ?? "(unspecified)"}

currentObject:
${JSON.stringify(obj, null, 2)}

instruction:
"""
${instruction}
"""

Return the FULL updated SceneObject as JSON. Preserve "id".`;

  try {
    const raw = await callLLM({
      provider: body.provider,
      model: body.model,
      system: SYSTEM,
      user: userMsg,
      assistantPrefill: "{",
      temperature: 0.4,
      maxTokens: 1200,
    });
    const parsed = parseJsonFromModel<unknown>(raw);
    const validated = validateObject(parsed, obj.id);
    // Force-preserve the original id so the editor patch always lands on
    // the right object even if the model rewrote it.
    const next: SceneObject = { ...validated, id: obj.id };
    return NextResponse.json({ object: next });
  } catch (err) {
    const status = err instanceof LLMError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status },
    );
  }
}
