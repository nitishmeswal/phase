import { NextResponse } from "next/server";
import {
  LLMError,
  callLLM,
  parseJsonFromModel,
  type ProviderId,
} from "@/lib/llm";
import { SCENE_SCHEMA_PROMPT } from "@/engine/schema";
import { validateScene, validateScenes } from "@/engine/validate";
import type { SceneDefinition } from "@/engine/types";

export const runtime = "nodejs";

interface Body {
  prompt?: string;
  /** When true, ask the model for an array of 1-3 connected scenes. */
  multi?: boolean;
  /** Optional LLM provider override (anthropic | openai | google | openrouter). */
  provider?: ProviderId;
  /** Optional model id override. */
  model?: string;
}

const SYSTEM = `${SCENE_SCHEMA_PROMPT}

When the user describes a single moment ("a chrome cube floats…"), output a
single scene as one JSON object.

When the user describes a sequence or asks for multiple scenes, output a JSON
array of 1 to 3 scenes that flow as a connected narrative — earlier scenes
should set up later ones, and morphTo targets should pay off in subsequent
scenes when possible.

Always return ONLY raw JSON. No prose, no markdown fences, no comments.`;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json(
      { error: "prompt too long (max 4000 chars)" },
      { status: 400 },
    );
  }

  const userMsg = body.multi
    ? `Build a sequence of 1 to 3 connected cinematic scenes that match this brief:

"""
${prompt}
"""

Return a JSON ARRAY of SceneDefinition objects in the order the user should scroll through them.`
    : `Build a single cinematic scene that matches this brief:

"""
${prompt}
"""

Return a single JSON SceneDefinition object.`;

  try {
    const raw = await callLLM({
      provider: body.provider,
      model: body.model,
      system: SYSTEM,
      user: userMsg,
      assistantPrefill: body.multi ? "[" : "{",
      temperature: 0.85,
      maxTokens: 3500,
    });
    const parsed = parseJsonFromModel<unknown>(raw);

    let scenes: SceneDefinition[];
    if (Array.isArray(parsed)) {
      scenes = validateScenes(parsed);
    } else {
      scenes = [validateScene(parsed)];
    }

    if (scenes.length === 0 || scenes[0].objects.length === 0) {
      return NextResponse.json(
        {
          error:
            "Model returned an empty scene. Try a more visual, action-oriented prompt.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ scenes });
  } catch (err) {
    const status = err instanceof LLMError ? err.status : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status },
    );
  }
}
