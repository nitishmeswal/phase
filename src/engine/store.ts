import { create } from "zustand";
import type { EngineState, SceneDefinition, SceneObject } from "./types";

export type BuilderStatus = "idle" | "generating" | "editing" | "error";

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
}

type Store = EngineState & EngineActions & { builder: BuilderState };

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

  setBuilderStatus: (status) =>
    set((s) => ({ builder: { ...s.builder, status } })),
  setBuilderError: (lastError) =>
    set((s) => ({ builder: { ...s.builder, lastError } })),
  setLastPrompt: (lastPrompt) =>
    set((s) => ({ builder: { ...s.builder, lastPrompt } })),
  setToast: (toast) => set((s) => ({ builder: { ...s.builder, toast } })),
  setIsUserProject: (isUserProject) =>
    set((s) => ({ builder: { ...s.builder, isUserProject } })),
}));
