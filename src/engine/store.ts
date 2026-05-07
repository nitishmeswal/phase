import { create } from "zustand";
import type { EngineState, SceneDefinition, SceneObject } from "./types";

interface EngineActions {
  setScenes: (scenes: SceneDefinition[]) => void;
  setCurrentSceneIndex: (i: number) => void;
  setScrollProgress: (p: number) => void;
  setGlobalProgress: (p: number) => void;
  toggleEditor: () => void;
  setSelectedObject: (id: string | null) => void;
  setHoveredObject: (id: string | null) => void;
  setEditorMode: (mode: EngineState["editor"]["mode"]) => void;
  updateObject: (sceneId: string, objectId: string, patch: Partial<SceneObject>) => void;
  setFps: (fps: number) => void;
}

export const useEngine = create<EngineState & EngineActions>((set) => ({
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

  setScenes: (scenes) => set({ scenes }),
  setCurrentSceneIndex: (i) => set({ currentSceneIndex: i }),
  setScrollProgress: (p) => set({ scrollProgress: p }),
  setGlobalProgress: (p) => set({ globalProgress: p }),
  toggleEditor: () =>
    set((s) => ({ editor: { ...s.editor, enabled: !s.editor.enabled } })),
  setSelectedObject: (id) =>
    set((s) => ({ editor: { ...s.editor, selectedObjectId: id } })),
  setHoveredObject: (id) =>
    set((s) => ({ editor: { ...s.editor, hoveredObjectId: id } })),
  setEditorMode: (mode) =>
    set((s) => ({ editor: { ...s.editor, mode } })),
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
  setFps: (fps) => set({ fps }),
}));
