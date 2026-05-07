# Phase — Cinematic AI-Native Web Experience Engine

> **Describe scenes. Direct motion. Export cinema.**

Phase is the engine for prompt-driven, scroll-choreographed, cinematic 3D
websites. Lovable for a webpage; Phase for the cinematic experience layered
on top. You describe a scene in plain English, the engine builds a scene
graph, choreographs proxy geometry on a scroll timeline, morphs meshes
between semantic states, and lets you visually correct any object inline.

---

## Mental Model

```
USER INPUT  (text now; image / sketch / hybrid later)
   │
   ▼
LANGUAGE → JSON  (LLM interpreter, currently Claude)
   │
   ▼
SCENE GRAPH  (validated, clamped SceneDefinition[])
   │
   ▼
PHASE ENGINE  (R3F + GSAP + morph engine + alive motion)
   │
   ▼
INTERACTIVE 3D EXPERIENCE  (scroll-driven, editable inline)
```

The **engine is the moat**. The LLM is a stateless interpreter — replaceable
with any model that can output our schema (OpenAI, Gemini, a fine-tuned
local model, even a hand-written DSL). Once a scene graph exists, every
animation, morph, scroll mapping, alive motion, post-processing pass and
visual edit is engine work, running in the browser, with no API calls.

---

## What ships in this prototype

- **Scene-graph schema** — strict TypeScript shape (`src/engine/types.ts`)
  shared between the renderer, the AI prompts, and the validator.
- **AI interpreter** — three thin Next.js API routes that turn natural
  language into scene-graph JSON: generate scene, edit object, edit scene.
- **Renderer** — R3F + Drei + post-processing (bloom, vignette,
  chromatic aberration) consumes the scene graph and draws it.
- **Scroll choreographer** — GSAP ScrollTrigger maps page scroll to scene
  index + per-scene 0→1 progress, drives camera interpolation and morphs.
- **Alive geometry** — procedural breathe / pulse / float / spin /
  squash-stretch / wobble layered on top of base transforms.
- **Morph engine** — vertex-position lerp between two BufferGeometries so a
  cube can semantically become a sphere or a torus-knot mid-scroll.
- **Visual editing layer** — click any object on canvas, inspect its
  metadata, type a natural-language correction ("make this glow more",
  "morph it into a torus knot", "slow it down"), the AI returns the
  patched SceneObject and the engine updates live.
- **Project persistence** — generated scenes survive reload via
  `localStorage`. Reset to demo, export full scene graph as JSON.
- **Builder dock** — `⌘K` opens a prompt input where you describe a single
  scene or a connected sequence of up to 3 scenes.

---

## Tech Stack

| Layer             | Tools                                      |
|-------------------|--------------------------------------------|
| Framework         | Next.js 14 (App Router), TypeScript        |
| 3D Rendering      | Three.js, React Three Fiber, Drei          |
| Animation         | GSAP ScrollTrigger, procedural motion      |
| Post-processing   | Bloom, Vignette, Chromatic Aberration      |
| State             | Zustand                                    |
| Styling           | Tailwind CSS                               |
| AI interpreter    | Anthropic Claude (swappable)               |

---

## Architecture

### Engine modules

| Module                  | Path                                                  | Purpose                                               |
|-------------------------|-------------------------------------------------------|-------------------------------------------------------|
| Engine types            | `src/engine/types.ts`                                 | Single source of truth for the scene-graph contract.  |
| Schema for the AI       | `src/engine/schema.ts`                                | Compact prompt describing the contract to the LLM.    |
| Validator               | `src/engine/validate.ts`                              | Defensive clamping of untrusted scene JSON.           |
| Demo seed               | `src/engine/sceneGraph.ts`                            | Three hand-authored demo scenes.                      |
| Persistence             | `src/engine/persistence.ts`                           | `localStorage` save / load.                           |
| Zustand store           | `src/engine/store.ts`                                 | Runtime state: scenes, scroll, editor, builder.       |
| Anthropic helper        | `src/lib/anthropic.ts`                                | Tiny `fetch`-based Messages API client + JSON parse.  |
| `PhaseCanvas`           | `src/components/canvas/PhaseCanvas.tsx`               | R3F canvas + post-processing.                         |
| `SceneRenderer`         | `src/components/canvas/SceneRenderer.tsx`             | Camera interpolation + per-scene object rendering.    |
| `ProxyMesh`             | `src/components/geometry/ProxyMesh.tsx`               | Alive geometry, materials, morph engine, picking.     |
| `ScrollChoreographer`   | `src/components/choreography/ScrollChoreographer.tsx` | GSAP ScrollTrigger → scene index + progress.          |
| `EditorOverlay`         | `src/components/editor/EditorOverlay.tsx`             | Inspector + AI direction prompt + scene/object mode.  |
| `PromptDock`            | `src/components/builder/PromptDock.tsx`               | `⌘K` builder modal — text → scene graph.              |
| `ProjectToolbar`        | `src/components/builder/ProjectToolbar.tsx`           | Reset / export project.                               |

### AI routes

| Route                   | In                                          | Out                                |
|-------------------------|---------------------------------------------|------------------------------------|
| `POST /api/generate-scene` | `{ prompt, multi? }`                      | `{ scenes: SceneDefinition[] }`    |
| `POST /api/edit-object`    | `{ object, prompt, sceneLabel? }`         | `{ object: SceneObject }`          |
| `POST /api/edit-scene`     | `{ scene, prompt }`                       | `{ scene: SceneDefinition }`       |

Each route ships the schema as a system prompt, asks Claude to return
**only JSON**, prefills the assistant turn with `{` or `[` to force the
shape, parses the response with a tolerant JSON extractor, then runs the
result through `validateScene` / `validateObject` so out-of-range or
unknown fields are clamped — never crashed.

### Coordinate conventions

- +Y up, +Z towards camera.
- Cameras typically [0, 0.4, 5] → [0, 1.5, 9].
- Objects within ±2.5 on X/Y, ±1 on Z; scales 0.4 → 2.4.
- Colors stay in a dark cinematic palette; objects may glow, never pure white.

---

## Getting Started

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

You will need an Anthropic API key. Either:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

…or place a `.env.local` file at the repo root:

```
ANTHROPIC_API_KEY=sk-ant-...
# Optional override:
# ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

The engine still loads and renders the demo scenes without an API key —
the prompt-builder just won't be able to author new scenes.

### Try it

- **Scroll** to play the demo project (3 hand-authored scenes).
- **`⌘K`** (or click the "Describe a scene" dock at the bottom) to open
  the builder. Try one of the example prompts or describe your own.
- **Toggle EDIT** in the top-right to enter the visual editor.
  - Click any object on the canvas.
  - Type a correction in plain English ("make it glow more", "morph into
    a torus knot", "slow it down", "move it left") and press Apply.
  - Switch the editor mode to "scene" to direct the whole scene at once.
- **Project menu** (top-left) lets you export the current scene graph as
  JSON or reset to the demo project.

---

## Roadmap

### Phase 1 — Local-first prototype  ✓

- [x] Scene-based architecture & strict scene-graph types
- [x] Scroll-driven choreography
- [x] Proxy-geometry system with alive motion
- [x] Vertex-lerp morph engine
- [x] Post-processing pipeline
- [x] Camera choreography
- [x] **Prompt → SceneDefinition (`/api/generate-scene`)**
- [x] **Visual edit → SceneObject patch (`/api/edit-object`)**
- [x] **Scene-level direction (`/api/edit-scene`)**
- [x] **Builder dock + visual editor wired to AI**
- [x] **Project persistence + JSON export**

### Phase 2 — Reusable engine

- [ ] Scene module registry (named, reusable scene archetypes)
- [ ] Timeline API (named keyframes, ease curves, named transitions)
- [ ] Object registry with semantic roles (hero, ambient, transition…)
- [ ] Scene transition manager (cuts, dissolves, momentum carries)

### Phase 3 — Visual tooling

- [ ] On-canvas transform gizmos
- [ ] Timeline scrubber + per-object keyframes
- [ ] Material picker & color palette UI
- [ ] Scene reorder / split / merge

### Phase 4 — Multimodal AI generation

- [ ] Image / moodboard / sketch input
- [ ] Auto choreography from a single still
- [ ] Motion suggestion engine (trained on our scene-graph corpus)
- [ ] Visual-region selection → AI correction (Lovable-style)
- [ ] Standalone codebase export (eject the engine + scenes as a static site)

---

## License

MIT
