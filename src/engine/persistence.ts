import type { SceneDefinition } from "./types";
import { validateScenes } from "./validate";

const STORAGE_KEY = "phase.project.v1";

interface StoredProject {
  version: 1;
  savedAt: number;
  scenes: SceneDefinition[];
}

export function loadProject(): SceneDefinition[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredProject>;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.scenes)) {
      return null;
    }
    const scenes = validateScenes(parsed.scenes);
    return scenes.length > 0 ? scenes : null;
  } catch {
    return null;
  }
}

export function saveProject(scenes: SceneDefinition[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredProject = {
      version: 1,
      savedAt: Date.now(),
      scenes,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (private mode, quota); silent.
  }
}

export function clearProject() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
