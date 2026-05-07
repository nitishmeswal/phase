"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { demoScenes } from "@/engine/sceneGraph";
import { useEngine } from "@/engine/store";
import ScrollChoreographer from "@/components/choreography/ScrollChoreographer";
import EditorOverlay from "@/components/editor/EditorOverlay";
import SceneIndicator from "@/components/ui/SceneIndicator";
import HUD from "@/components/ui/HUD";
import LandingCopy from "@/components/ui/LandingCopy";

const PhaseCanvas = dynamic(() => import("@/components/canvas/PhaseCanvas"), {
  ssr: false,
});

export default function Home() {
  const setScenes = useEngine((s) => s.setScenes);

  useEffect(() => {
    setScenes(demoScenes);
  }, [setScenes]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#03040a] text-white selection:bg-cyan-300 selection:text-black">
      <PhaseCanvas />
      <ScrollChoreographer />
      <LandingCopy />
      <SceneIndicator />
      <HUD />
      <EditorOverlay />

      <div className="fixed bottom-6 right-6 z-30 text-[10px] font-mono text-white/25 tracking-[0.2em] pointer-events-none">
        SCROLL TO DIRECT THE FILM
      </div>
    </div>
  );
}
