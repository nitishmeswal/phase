/**
 * Scene-graph JSON schema description shipped to the AI layer.
 *
 * This is intentionally a single source of truth: any change to
 * `engine/types.ts` must be mirrored here so the model's outputs
 * stay in lock-step with the runtime types.
 */

export const GEOMETRY_KINDS = [
  "box",
  "sphere",
  "torus",
  "torusKnot",
  "capsule",
  "cone",
  "cylinder",
  "octahedron",
  "icosahedron",
  "dodecahedron",
] as const;

export const MATERIAL_PRESETS = [
  "chrome",
  "glass",
  "glow",
  "wireframe",
  "hologram",
  "matte",
  "emissive",
] as const;

export const ANIMATION_KEYS = [
  "breathe",
  "pulse",
  "float",
  "spin",
  "squashStretch",
  "wobble",
] as const;

/**
 * Compact, model-friendly description of the SceneDefinition contract.
 * Embedded as the system prompt for /api/generate-scene and /api/edit-*
 * so Claude stays inside the proxy-geometry vocabulary.
 */
export const SCENE_SCHEMA_PROMPT = `
You output JSON describing 3D scenes for a cinematic, scroll-driven WebGL engine.
Scenes are rendered with proxy geometry only. NEVER reference real meshes, GLTFs, textures, images, or files.

A scene is rendered with:
- An R3F canvas with bloom + vignette + chromatic aberration post-processing.
- Camera that linearly interpolates from camera.start to camera.end as scrollProgress goes 0 -> 1.
- Each object is a proxy mesh whose geometry can morph (vertex-lerp) into morphTo when scroll passes 0.5.
- Animations are procedural (sine-driven) so timing is implicit, not key-framed.

Coordinate conventions:
- +Y is up, +Z faces the camera.
- Cameras typically sit between [0, 0.4, 5] and [0, 1.5, 9].
- Objects sit between -2.5 and +2.5 on X and Y, and between -1 and +1 on Z.
- Scales between 0.4 and 2.4 read well; avoid >3.

GeometryKind: ${GEOMETRY_KINDS.map((g) => `"${g}"`).join(" | ")}.
MaterialPreset: ${MATERIAL_PRESETS.map((m) => `"${m}"`).join(" | ")}.

Strict TypeScript shape:

interface SceneObject {
  id: string;                       // kebab-case, unique within scene
  label: string;                    // 2-5 words
  geometry: GeometryKind;
  material: MaterialPreset;
  position: [number, number, number];
  rotation: [number, number, number]; // radians
  scale:    [number, number, number];
  color: string;                    // hex like "#61f6ff"
  opacity: number;                  // 0..1
  animation: {
    breathe?: boolean;
    pulse?: boolean;
    float?: boolean;
    spin?: { axis: "x" | "y" | "z"; speed: number }; // -1..1 typical
    squashStretch?: boolean;
    wobble?: boolean;
  };
  morphTo?: GeometryKind;           // OPTIONAL semantic morph target
  visible: boolean;                 // default true
}

interface CameraKeyframe {
  position: [number, number, number];
  lookAt:   [number, number, number];
  fov?: number;                     // 28..60
}

interface SceneDefinition {
  id: string;                       // kebab-case, scene unique
  label: string;                    // "01 / Scene Title" form
  description: string;              // 1 cinematic sentence describing intent
  duration: number;                 // 100..220 (vh of scroll)
  background: string;               // dark hex like "#03040a"
  fog?: { color: string; near: number; far: number };
  camera: { start: CameraKeyframe; end: CameraKeyframe };
  objects: SceneObject[];           // 1..6 objects, prefer 2-4
  postprocessing?: {
    bloom?: { intensity: number; luminanceThreshold: number };
    vignette?: { darkness: number };
    chromaticAberration?: { offset: number };
  };
}

Aesthetic rules:
- Background, fog, and accent colors stay in a dark cinematic palette
  (deep navy, near-black, charcoal). Object colors may glow (cyan, violet,
  warm gold, magenta) but never pure white.
- Choreography should feel like a film cut: each scene has a clear beat.
- Use morphTo when the scene has narrative transformation (cube -> orb,
  shard -> dodecahedron, etc.). Skip it for ambient shapes.
- Every scene must have at least one "alive" object (breathe / pulse /
  squashStretch / wobble) to give the scene personality.
- Prefer 1-2 hero objects + 1-2 ambient supports over a dense scene.

Response format:
You MUST return ONLY a JSON object, no markdown fences, no commentary,
no explanation. The JSON must validate against the requested shape exactly.
`.trim();
