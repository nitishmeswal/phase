"use client";

import { useEngine } from "@/engine/store";
import { demoScenes } from "@/engine/sceneGraph";
import { clearProject } from "@/engine/persistence";
import { useState } from "react";

export default function ProjectToolbar() {
  const scenes = useEngine((s) => s.scenes);
  const isUserProject = useEngine((s) => s.builder.isUserProject);
  const setScenes = useEngine((s) => s.setScenes);
  const setIsUserProject = useEngine((s) => s.setIsUserProject);
  const setToast = useEngine((s) => s.setToast);

  const [open, setOpen] = useState(false);

  function exportJson() {
    if (typeof window === "undefined") return;
    const json = JSON.stringify(scenes, null, 2);
    navigator.clipboard
      ?.writeText(json)
      .then(() => setToast("Scene graph copied to clipboard."))
      .catch(() => {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "phase-scene.json";
        a.click();
        URL.revokeObjectURL(url);
        setToast("Scene graph downloaded.");
      });
  }

  function resetToDemo() {
    setScenes(demoScenes);
    setIsUserProject(false);
    clearProject();
    setToast("Restored demo project.");
  }

  return (
    <div className="fixed top-5 left-5 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`px-3 py-2 rounded-full text-[10px] font-mono tracking-[0.22em] backdrop-blur-md border transition-all ${
          open
            ? "bg-white/10 border-white/30 text-white"
            : "bg-white/5 border-white/10 text-white/55 hover:text-white hover:border-white/30"
        }`}
      >
        {isUserProject ? "◆ MY PROJECT" : "◇ DEMO PROJECT"}
      </button>

      {open && (
        <div className="absolute top-12 left-0 w-64 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl p-3 shadow-2xl space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/30 px-1 pt-1">
            Project
          </div>
          <div className="grid gap-1.5">
            <button
              onClick={() => {
                exportJson();
                setOpen(false);
              }}
              className="text-left text-xs font-mono text-white/70 hover:text-cyan-200 px-3 py-2 rounded-lg hover:bg-cyan-300/5 border border-transparent hover:border-cyan-300/20 transition-all"
            >
              ⬇ Export scene graph (JSON)
            </button>
            <button
              onClick={() => {
                resetToDemo();
                setOpen(false);
              }}
              className="text-left text-xs font-mono text-white/70 hover:text-cyan-200 px-3 py-2 rounded-lg hover:bg-cyan-300/5 border border-transparent hover:border-cyan-300/20 transition-all"
            >
              ↺ Reset to demo project
            </button>
          </div>
          <div className="border-t border-white/5 pt-2 px-1">
            <div className="text-[10px] font-mono text-white/25">
              {scenes.length} scene{scenes.length === 1 ? "" : "s"} ·{" "}
              {scenes.reduce((n, s) => n + s.objects.length, 0)} objects
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
