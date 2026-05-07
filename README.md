# Phase — Cinematic AI-Native Web Experience Engine

> **Describe scenes. Direct motion. Export cinema.**

Phase is a prototype engine for building cinematic, AI-assisted WebGL websites where:

- Users describe scenes via text
- Scroll drives narrative progression
- Proxy geometry is choreographed in 3D
- Objects morph between semantic states
- Scenes behave like interactive films
- Users can visually correct the canvas inline

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

---

## Architecture

```
INPUT (text / image / hybrid)
  ↓
Scene Understanding
  ↓
Scene Graph (JSON definitions)
  ↓
3D Choreography Engine (GSAP + ScrollTrigger)
  ↓
Animation / Morph System (procedural + interpolation)
  ↓
Interactive Timeline (scroll-driven)
  ↓
Visual Editing Layer (object selection + AI corrections)
  ↓
Exportable Web Experience
```

### Key Modules

| Module                   | Path                                       | Purpose                                   |
|--------------------------|--------------------------------------------|-------------------------------------------|
| **Engine Types**         | `src/engine/types.ts`                      | Core type definitions                     |
| **Scene Graph**          | `src/engine/sceneGraph.ts`                 | Scene definitions & object intents        |
| **State Store**          | `src/engine/store.ts`                      | Zustand global state                      |
| **PhaseCanvas**          | `src/components/canvas/PhaseCanvas.tsx`     | R3F canvas + post-processing              |
| **SceneRenderer**        | `src/components/canvas/SceneRenderer.tsx`   | Camera choreography + object rendering    |
| **ProxyMesh**            | `src/components/geometry/ProxyMesh.tsx`     | Alive geometry + morph engine             |
| **ScrollChoreographer**  | `src/components/choreography/...`          | GSAP ScrollTrigger integration            |
| **EditorOverlay**        | `src/components/editor/EditorOverlay.tsx`   | Visual editing + AI correction panel      |

---

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000 and scroll to experience the cinematic scenes.

- **Ctrl+Click objects** in editor mode to inspect them
- **Toggle editor** via the button in the top-right corner
- **Scroll** to progress through scenes and trigger morph animations

---

## Phase 1 (Current) — Local-First Prototype

- [x] Scene-based architecture (scene graph, JSON configs)
- [x] Scroll-driven choreography (GSAP ScrollTrigger)
- [x] Proxy geometry system (alive cubes, spheres, torus knots)
- [x] Animation behaviours (breathe, pulse, float, spin, wobble, squash/stretch)
- [x] Morph engine (geometry interpolation between semantic states)
- [x] Visual editing overlay (object selection, metadata, AI correction panel)
- [x] Post-processing pipeline (bloom, vignette, chromatic aberration)
- [x] Camera choreography (interpolated camera paths per scene)

## Phase 2 — Reusable Engine

- [ ] Scene module system
- [ ] Timeline API
- [ ] Object registry
- [ ] Transition manager

## Phase 3 — Visual Tooling

- [ ] Scene editor
- [ ] Timeline scrubber
- [ ] Object transform gizmos
- [ ] Material picker

## Phase 4 — AI-Assisted Generation

- [ ] Prompt → scene generation
- [ ] Auto choreography
- [ ] Motion suggestions
- [ ] Visual edit interpretation

---

## License

MIT
