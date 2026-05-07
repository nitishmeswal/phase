import { create } from "zustand";
import type { EngineState, SceneDefinition, SceneObject } from "./types";
import type { DoodleStroke, DoodleTool } from "./doodle";
import { DOODLE_TOOL_META } from "./doodle";
import type { GeometryKind } from "./types";
import type { ProviderId, ProviderInfo } from "@/lib/llm";
import { saveLLMSelection } from "./persistence";

export type BuilderStatus = "idle" | "generating" | "editing" | "error";

interface LLMState {
  /** Manifest fetched from /api/providers, or null until loaded. */
  manifest: ProviderInfo[] | null;
  /** Provider currently selected for new requests. */
  provider: ProviderId;
  /** Model id; null means "use the provider's default". */
  model: string | null;
}

interface DoodleState {
  enabled: boolean;
  tool: DoodleTool;
  /** Active stroke being drawn — committed to `strokes` on pointer-up. */
  pending: DoodleStroke | null;
  strokes: DoodleStroke[];
  /** Default placement shape for the "place" brush. */
  placeShape: GeometryKind;
  /** Default morph target geometry for the "morph" brush. */
  morphTarget: GeometryKind;
}

interface BuilderState {
  status: BuilderStatus;
  lastPrompt: string;
  lastError: string | null;
  /** Most recent toast-style notification surfaced to the user. */
  toast: string | null;
  /** Set true once we've replaced the seed demo with user-generated scenes. */
  isUserProject: boolean;
}

interface EngineActions {
  setLLMManifest: (manifest: ProviderInfo[]) => void;
  setLLMProvider: (provider: ProviderId, model?: string | null) => void;
  setLLMModel: (model: string | null) => void;

  setScenes: (scenes: SceneDefinition[]) => void;
  appendScenes: (scenes: SceneDefinition[]) => void;
  replaceScene: (sceneId: string, scene: SceneDefinition) => void;
  removeScene: (sceneId: string) => void;
  setCurrentSceneIndex: (i: number) => void;
  setScrollProgress: (p: number) => void;
  setGlobalProgress: (p: number) => void;
  toggleEditor: () => void;
  setSelectedObject: (id: string | null) => void;
  setHoveredObject: (id: string | null) => void;
  setEditorMode: (mode: EngineState["editor"]["mode"]) => void;
  updateObject: (
    sceneId: string,
    objectId: string,
    patch: Partial<SceneObject>,
  ) => void;
  replaceObject: (sceneId: string, object: SceneObject) => void;
  removeObject: (sceneId: string, objectId: string) => void;
  setFps: (fps: number) => void;

  setBuilderStatus: (s: BuilderStatus) => void;
  setBuilderError: (err: string | null) => void;
  setLastPrompt: (p: string) => void;
  setToast: (msg: string | null) => void;
  setIsUserProject: (v: boolean) => void;

  toggleDoodle: () => void;
  setDoodleTool: (tool: DoodleTool) => void;
  setDoodlePlaceShape: (shape: GeometryKind) => void;
  setDoodleMorphTarget: (shape: GeometryKind) => void;
  setDoodlePending: (stroke: DoodleStroke | null) => void;
  commitDoodleStroke: (stroke: DoodleStroke) => void;
  undoDoodleStroke: () => void;
  clearDoodle: () => void;
}

type Store = EngineState &
  EngineActions & {
    builder: BuilderState;
    doodle: DoodleState;
    llm: LLMState;
  };

export const useEngine = create<Store>((set) => ({
  scenes: [],
  currentSceneIndex: 0,
  scrollProgress: 0,
  globalProgress: 0,
  isPlaying: true,
  fps: 60,
  editor: {
    enabled: false,
    selectedObjectId: null,
    hoveredObjectId: null,
    mode: "select",
  },
  builder: {
    status: "idle",
    lastPrompt: "",
    lastError: null,
    toast: null,
    isUserProject: false,
  },
  doodle: {
    enabled: false,
    tool: "path",
    pending: null,
    strokes: [],
    placeShape: "sphere",
    morphTarget: "sphere",
  },
  llm: {
    manifest: null,
    provider: "anthropic",
    model: null,
  },

  setScenes: (scenes) =>
    set(() => ({
      scenes,
      currentSceneIndex: 0,
      scrollProgress: 0,
      globalProgress: 0,
    })),
  appendScenes: (additional) =>
    set((s) => ({ scenes: [...s.scenes, ...additional] })),
  replaceScene: (sceneId, scene) =>
    set((s) => ({
      scenes: s.scenes.map((sc) => (sc.id === sceneId ? scene : sc)),
    })),
  removeScene: (sceneId) =>
    set((s) => {
      const next = s.scenes.filter((sc) => sc.id !== sceneId);
      const idx = Math.min(s.currentSceneIndex, Math.max(next.length - 1, 0));
      return { scenes: next, currentSceneIndex: idx };
    }),

  setCurrentSceneIndex: (i) => set({ currentSceneIndex: i }),
  setScrollProgress: (p) => set({ scrollProgress: p }),
  setGlobalProgress: (p) => set({ globalProgress: p }),

  toggleEditor: () =>
    set((s) => ({ editor: { ...s.editor, enabled: !s.editor.enabled } })),
  setSelectedObject: (id) =>
    set((s) => ({ editor: { ...s.editor, selectedObjectId: id } })),
  setHoveredObject: (id) =>
    set((s) => ({ editor: { ...s.editor, hoveredObjectId: id } })),
  setEditorMode: (mode) => set((s) => ({ editor: { ...s.editor, mode } })),

  updateObject: (sceneId, objectId, patch) =>
    set((s) => ({
      scenes: s.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              objects: scene.objects.map((obj) =>
                obj.id === objectId ? { ...obj, ...patch } : obj,
              ),
            }
          : scene,
      ),
    })),
  replaceObject: (sceneId, object) =>
    set((s) => ({
      scenes: s.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              objects: scene.objects.map((obj) =>
                obj.id === object.id ? object : obj,
              ),
            }
          : scene,
      ),
    })),
  removeObject: (sceneId, objectId) =>
    set((s) => ({
      scenes: s.scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              objects: scene.objects.filter((obj) => obj.id !== objectId),
            }
          : scene,
      ),
    })),

  setFps: (fps) => set({ fps }),

  setLLMManifest: (manifest) =>
    set((s) => ({ llm: { ...s.llm, manifest } })),
  setLLMProvider: (provider, model = null) =>
    set((s) => {
      saveLLMSelection({ version: 1, provider, model });
      return { llm: { ...s.llm, provider, model } };
    }),
  setLLMModel: (model) =>
    set((s) => {
      saveLLMSelection({ version: 1, provider: s.llm.provider, model });
      return { llm: { ...s.llm, model } };
    }),

  setBuilderStatus: (status) =>
    set((s) => ({ builder: { ...s.builder, status } })),
  setBuilderError: (lastError) =>
    set((s) => ({ builder: { ...s.builder, lastError } })),
  setLastPrompt: (lastPrompt) =>
    set((s) => ({ builder: { ...s.builder, lastPrompt } })),
  setToast: (toast) => set((s) => ({ builder: { ...s.builder, toast } })),
  setIsUserProject: (isUserProject) =>
    set((s) => ({ builder: { ...s.builder, isUserProject } })),

  toggleDoodle: () =>
    set((s) => ({
      doodle: {
        ...s.doodle,
        enabled: !s.doodle.enabled,
        // When toggling off, drop any in-flight stroke so we don't strand it.
        pending: !s.doodle.enabled ? s.doodle.pending : null,
      },
    })),
  setDoodleTool: (tool) =>
    set((s) => ({
      doodle: {
        ...s.doodle,
        tool,
        pending: null,
      },
      // Show the tool's hint as a transient toast so users learn the gestures.
      builder: { ...s.builder, toast: DOODLE_TOOL_META[tool].hint },
    })),
  setDoodlePlaceShape: (placeShape) =>
    set((s) => ({ doodle: { ...s.doodle, placeShape } })),
  setDoodleMorphTarget: (morphTarget) =>
    set((s) => ({ doodle: { ...s.doodle, morphTarget } })),
  setDoodlePending: (pending) =>
    set((s) => ({ doodle: { ...s.doodle, pending } })),
  commitDoodleStroke: (stroke) =>
    set((s) => ({
      doodle: {
        ...s.doodle,
        pending: null,
        strokes: [...s.doodle.strokes, stroke],
      },
    })),
  undoDoodleStroke: () =>
    set((s) => ({
      doodle: { ...s.doodle, strokes: s.doodle.strokes.slice(0, -1) },
    })),
  clearDoodle: () =>
    set((s) => ({ doodle: { ...s.doodle, strokes: [], pending: null } })),
}));
