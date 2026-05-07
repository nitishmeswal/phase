"use client";

import { useEngine } from "@/engine/store";

export default function SceneIndicator() {
  const scenes = useEngine((s) => s.scenes);
  const currentSceneIndex = useEngine((s) => s.currentSceneIndex);
  const scrollProgress = useEngine((s) => s.scrollProgress);

  if (scenes.length === 0) return null;
  const scene = scenes[currentSceneIndex];

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3">
      {scenes.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                i === currentSceneIndex
                  ? "bg-cyan-400 shadow-[0_0_12px_rgba(0,255,255,0.5)] scale-125"
                  : i < currentSceneIndex
                    ? "bg-white/30"
                    : "bg-white/10"
              }`}
            />
            {i === currentSceneIndex && (
              <div
                className="absolute -inset-1 rounded-full border border-cyan-400/30 animate-ping"
                style={{ animationDuration: "2s" }}
              />
            )}
          </div>
          {i === currentSceneIndex && (
            <div className="text-[10px] font-mono text-white/40 tracking-widest whitespace-nowrap">
              {scene.label}
            </div>
          )}
        </div>
      ))}

      {/* Progress bar for current scene */}
      <div className="w-px h-12 bg-white/5 relative mt-2">
        <div
          className="absolute top-0 left-0 w-full bg-cyan-400/60 transition-all duration-100"
          style={{ height: `${scrollProgress * 100}%` }}
        />
      </div>
    </div>
  );
}
