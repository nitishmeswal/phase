"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { demoScenes } from "@/engine/sceneGraph";
import { useEngine } from "@/engine/store";
import ScrollChoreographer from "@/components/choreography/ScrollChoreographer";
import EditorOverlay from "@/components/editor/EditorOverlay";
import SceneIndicator from "@/components/ui/SceneIndicator";
import HUD from "@/components/ui/HUD";
import PromptDock from "@/components/builder/PromptDock";
import ProjectToolbar from "@/components/builder/ProjectToolbar";
import DoodleOverlay from "@/components/builder/DoodleOverlay";
import DoodleToggle from "@/components/builder/DoodleToggle";
import ModelPicker from "@/components/builder/ModelPicker";
import Toaster from "@/components/ui/Toaster";
import { loadProject, saveProject } from "@/engine/persistence";

const PhaseCanvas = dynamic(() => import("@/components/canvas/PhaseCanvas"), {
  ssr: false,
});

/**
 * /build — the live playground.
 *
 * 3D canvas + scroll choreographer + every UI overlay (prompt dock, editor,
 * doodle layer, project toolbar, scene indicator, HUD, toaster).
 *
 * The marketing landing page lives at /. It mounts a different, lighter
 * subset of the engine.
 */
export default function BuildPage() {
  const setScenes = useEngine((s) => s.setScenes);
  const setIsUserProject = useEngine((s) => s.setIsUserProject);
  const scenes = useEngine((s) => s.scenes);
  const isUserProject = useEngine((s) => s.builder.isUserProject);
  const hydrated = useRef(false);

  // Hydrate from localStorage once on mount; fall back to demo scenes.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const saved = loadProject();
    if (saved && saved.length > 0) {
      setScenes(saved);
      setIsUserProject(true);
    } else {
      setScenes(demoScenes);
    }
  }, [setScenes, setIsUserProject]);

  // Persist user-generated projects on every change.
  useEffect(() => {
    if (!isUserProject || scenes.length === 0) return;
    saveProject(scenes);
  }, [isUserProject, scenes]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03040a] text-white selection:bg-cyan-300 selection:text-black">
      <PhaseCanvas />
      <ScrollChoreographer />
      <SceneIndicator />
      <HUD />
      <ProjectToolbar />
      <ModelPicker />
      <EditorOverlay />
      <DoodleToggle />
      <DoodleOverlay />
      <PromptDock />
      <Toaster />

      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-4 text-[10px] font-mono text-white/25 tracking-[0.2em]">
        <span className="pointer-events-none">SCROLL TO DIRECT THE FILM</span>
        <span className="pointer-events-none text-white/15">·</span>
        <Link
          href="/"
          className="pointer-events-auto text-white/35 hover:text-white transition-colors uppercase"
        >
          ← BACK TO LANDING
        </Link>
      </div>
    </div>
  );
}
