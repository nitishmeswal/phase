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
- **AI interpreter** — four thin Next.js API routes that turn natural
  language *or doodles* into scene-graph JSON: generate scene, edit object,
  edit scene, apply doodle.
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
- **Doodle director** — toggle DRAW mode and *sketch* the choreography
  on top of the live viewport. Each brush is a different motion intent
  (path, swirl, glow, pulse, burst, place, morph, erase). The strokes are
  normalized to scene coordinates and the AI patches the scene graph
  accordingly. See "Doodle pipeline" below.
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
| AI interpreter    | Anthropic / OpenAI / Google / OpenRouter   |

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
| LLM dispatcher          | `src/lib/llm/index.ts`                                | Single entrypoint; picks provider + model.            |
| Provider adapters       | `src/lib/llm/providers/*.ts`                          | Anthropic / OpenAI / Google / OpenRouter HTTP clients.|
| Model catalog           | `src/lib/llm/models.ts`                               | Curated models per provider with per-MTok pricing.    |
| `PhaseCanvas`           | `src/components/canvas/PhaseCanvas.tsx`               | R3F canvas + post-processing.                         |
| `SceneRenderer`         | `src/components/canvas/SceneRenderer.tsx`             | Camera interpolation + per-scene object rendering.    |
| `ProxyMesh`             | `src/components/geometry/ProxyMesh.tsx`               | Alive geometry, materials, morph engine, picking.     |
| `ScrollChoreographer`   | `src/components/choreography/ScrollChoreographer.tsx` | GSAP ScrollTrigger → scene index + progress.          |
| `EditorOverlay`         | `src/components/editor/EditorOverlay.tsx`             | Inspector + AI direction prompt + scene/object mode.  |
| `PromptDock`            | `src/components/builder/PromptDock.tsx`               | `⌘K` builder modal — text → scene graph.              |
| `DoodleOverlay`         | `src/components/builder/DoodleOverlay.tsx`            | SVG draw surface + brush toolbar + apply pipeline.    |
| `DoodleToggle`          | `src/components/builder/DoodleToggle.tsx`             | Top-right "DRAW" button that arms doodle mode.        |
| Doodle types            | `src/engine/doodle.ts`                                | Brush vocabulary, normalization, stroke geometry.     |
| `ProjectToolbar`        | `src/components/builder/ProjectToolbar.tsx`           | Reset / export project.                               |
| `ModelPicker`           | `src/components/builder/ModelPicker.tsx`              | Provider + model dropdown; persists to `localStorage`.|

### AI routes

| Route                       | In                                                                | Out                                |
|-----------------------------|-------------------------------------------------------------------|------------------------------------|
| `POST /api/generate-scene`  | `{ prompt, multi?, provider?, model? }`                           | `{ scenes: SceneDefinition[] }`    |
| `POST /api/edit-object`     | `{ object, prompt, sceneLabel?, provider?, model? }`              | `{ object: SceneObject }`          |
| `POST /api/edit-scene`      | `{ scene, prompt, provider?, model? }`                            | `{ scene: SceneDefinition }`       |
| `POST /api/apply-doodle`    | `{ scene, strokes: DoodleStroke[], prompt?, provider?, model? }`  | `{ scene: SceneDefinition }`       |
| `GET  /api/providers`       | —                                                                 | `{ providers, defaultProviderId }` |

Each route ships the schema as a system prompt, asks the chosen LLM to
return **only JSON**, prefills the assistant turn with `{` or `[` to
force the shape, parses the response with a tolerant JSON extractor,
then runs the result through `validateScene` / `validateObject` so
out-of-range or unknown fields are clamped — never crashed.

### Swappable LLM providers

Phase ships with adapters for four providers. Pick one per request, or
set deployment-wide defaults via env. The model picker dropdown in `/build`
(top-left, next to the project toolbar) lets users flip between providers
and models per call; selection persists in `localStorage`.

| Provider     | Env var                                     | Default model                |
|--------------|---------------------------------------------|------------------------------|
| Anthropic    | `ANTHROPIC_API_KEY`                         | `claude-sonnet-4-20250514`   |
| OpenAI       | `OPENAI_API_KEY`                            | `gpt-4o`                     |
| Google       | `GOOGLE_API_KEY` (or `GEMINI_API_KEY`)      | `gemini-2.5-flash`           |
| OpenRouter   | `OPENROUTER_API_KEY`                        | `anthropic/claude-sonnet-4`  |

Server-wide overrides:

```bash
LLM_PROVIDER=openai          # which provider to use when none is requested
LLM_MODEL=gpt-4o-mini        # which model to use when none is requested
```

`GET /api/providers` returns the list of providers along with which ones
are actually configured on this deployment, so the UI greys out
providers without an API key. Adding a provider is one new file in
`src/lib/llm/providers/` plus an entry in `src/lib/llm/models.ts`.

### Doodle pipeline

```
DOODLE STROKES (2D, viewport-normalized, with brush + tool metadata)
   │
   ▼
/api/apply-doodle  ──[ Claude w/ brush vocabulary ]──> SceneDefinition
   │
   ▼
Validator → live render
```

Strokes are simplified to ≤24 points and tagged with their centroid +
bounds before being sent, so the model reasons about shape and region,
not pixel noise. The 2D drawing space is normalized to scene coords
(`x ∈ [-2.5, 2.5]`, `y ∈ [-1.5, 1.5]`, `+Y` up) so a stroke at
*viewport-bottom-right* is interpreted as a 3D position at
*scene-bottom-right* with no further math.

#### Brush vocabulary

| Brush     | Gesture                  | Effect on the scene graph                                              |
|-----------|--------------------------|-------------------------------------------------------------------------|
| **Path**  | Free curve               | Hints object placement & motion personality (adds float + soft spin).   |
| **Swirl** | Spiral / circular gesture| Adds spin/orbit to the closest object, axis from gesture plane.         |
| **Glow**  | Scribble over a region   | Sets `material: glow`/`emissive`, raises bloom, drops a glow if empty.  |
| **Pulse** | Circle / throb           | Adds `breathe + pulse`; drops a pulsing icosahedron if region is empty. |
| **Burst** | X / star / radial mark   | Scatters 3-5 small ambient shapes around the centroid.                  |
| **Place** | Tap (pick a shape first) | Drops one new SceneObject of the chosen geometry at the tap.            |
| **Morph** | Line A→B (pick a target) | Sets `morphTo` on the start object so it morphs into the target shape.  |
| **Erase** | Cross-out over an object | Removes that object.                                                    |

Hotkeys: `1..8` switch brush, `⌘Z` undo, `Esc` exit doodle mode.

### Coordinate conventions

- +Y up, +Z towards camera.
- Cameras typically [0, 0.4, 5] → [0, 1.5, 9].
- Objects within ±2.5 on X/Y, ±1 on Z; scales 0.4 → 2.4.
- Colors stay in a dark cinematic palette; objects may glow, never pure white.
- The doodle layer uses the same X/Y range so strokes map 1:1 into scene space.

---

## Getting Started

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

You will need an API key for **at least one** supported provider:

```bash
export ANTHROPIC_API_KEY=sk-ant-...     # most flexible default
# or, instead / in addition to:
export OPENAI_API_KEY=sk-...
export GOOGLE_API_KEY=AIza...           # alias: GEMINI_API_KEY
export OPENROUTER_API_KEY=sk-or-...
```

…or place a `.env.local` file at the repo root with any subset of the
above. The model picker in `/build` only enables providers whose key is
actually configured on the server.

The engine still loads and renders the demo scenes without any API key
— the prompt-builder, editor, and doodle director just won't be able to
author new scenes.

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
- **DRAW** (top-right) toggles doodle mode. Pick a brush and sketch
  directly over the live canvas — swirl over a cube to spin it, scribble
  glow over a region, tap with the place brush to drop a new shape, draw
  a line from one object to another to morph the first into the second.
  Press *Apply doodle* and the scene rebuilds.
- **Model picker** (top-left, next to the project toolbar) flips the LLM
  used by every prompt / doodle / edit call. Cheap providers like Gemini
  Flash or GPT-4o-mini cost roughly 5× less per call than Sonnet 4 — your
  choice persists across sessions.

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
- [x] **Doodle director — draw motion / placement / morphs onto the canvas
       (`/api/apply-doodle`)**

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
