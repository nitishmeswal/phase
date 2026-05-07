import type { Vector3Tuple } from "three";

/* ------------------------------------------------------------------ */
/*  Primitive geometry tokens the proxy system understands             */
/* ------------------------------------------------------------------ */
export type GeometryKind =
  | "box"
  | "sphere"
  | "torus"
  | "torusKnot"
  | "capsule"
  | "cone"
  | "cylinder"
  | "octahedron"
  | "icosahedron"
  | "dodecahedron";

/* ------------------------------------------------------------------ */
/*  Material presets                                                    */
/* ------------------------------------------------------------------ */
export type MaterialPreset =
  | "chrome"
  | "glass"
  | "glow"
  | "wireframe"
  | "hologram"
  | "matte"
  | "emissive";

/* ------------------------------------------------------------------ */
/*  Per-object animation behaviours                                    */
/* ------------------------------------------------------------------ */
export interface AnimationBehaviour {
  breathe?: boolean;
  pulse?: boolean;
  float?: boolean;
  spin?: { axis: "x" | "y" | "z"; speed: number };
  squashStretch?: boolean;
  wobble?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Scene-object node                                                  */
/* ------------------------------------------------------------------ */
export interface SceneObject {
  id: string;
  label: string;
  geometry: GeometryKind;
  material: MaterialPreset;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  color: string;
  opacity: number;
  animation: AnimationBehaviour;
  morphTo?: GeometryKind;
  visible: boolean;
}

/* ------------------------------------------------------------------ */
/*  Camera keyframe                                                    */
/* ------------------------------------------------------------------ */
export interface CameraKeyframe {
  position: Vector3Tuple;
  lookAt: Vector3Tuple;
  fov?: number;
}

/* ------------------------------------------------------------------ */
/*  Scene definition                                                   */
/* ------------------------------------------------------------------ */
export interface SceneDefinition {
  id: string;
  label: string;
  description: string;
  duration: number;           // in scroll-units (vh)
  camera: {
    start: CameraKeyframe;
    end: CameraKeyframe;
  };
  objects: SceneObject[];
  background: string;
  fog?: { color: string; near: number; far: number };
  postprocessing?: {
    bloom?: { intensity: number; luminanceThreshold: number };
    vignette?: { darkness: number };
    chromaticAberration?: { offset: number };
  };
}

/* ------------------------------------------------------------------ */
/*  Editor state                                                       */
/* ------------------------------------------------------------------ */
export interface EditorState {
  enabled: boolean;
  selectedObjectId: string | null;
  hoveredObjectId: string | null;
  mode: "select" | "translate" | "rotate" | "scale";
}

/* ------------------------------------------------------------------ */
/*  Global engine state                                                */
/* ------------------------------------------------------------------ */
export interface EngineState {
  scenes: SceneDefinition[];
  currentSceneIndex: number;
  scrollProgress: number;       // 0-1 within current scene
  globalProgress: number;       // 0-1 across all scenes
  editor: EditorState;
  isPlaying: boolean;
  fps: number;
}
