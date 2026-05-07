"use client";

import { useEngine } from "@/engine/store";
import { useEffect, useState } from "react";

export default function HUD() {
  const scenes = useEngine((s) => s.scenes);
  const currentSceneIndex = useEngine((s) => s.currentSceneIndex);
  const scrollProgress = useEngine((s) => s.scrollProgress);
  const scene = scenes[currentSceneIndex];

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [currentSceneIndex, scrollProgress]);

  if (!scene) return null;

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/5 rounded-full px-6 py-3">
        <div className="text-[10px] font-mono text-cyan-400/80 tracking-[0.25em]">
          {scene.label}
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="text-[10px] font-mono text-white/30">
          {scene.description.slice(0, 60)}
          {scene.description.length > 60 && "…"}
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="text-[10px] font-mono text-white/20">
          {(scrollProgress * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
