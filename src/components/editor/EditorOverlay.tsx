"use client";

import { useEngine } from "@/engine/store";
import { objectIntentMap } from "@/engine/sceneGraph";
import { useState } from "react";

export default function EditorOverlay() {
  const editorEnabled = useEngine((s) => s.editor.enabled);
  const toggleEditor = useEngine((s) => s.toggleEditor);
  const selectedId = useEngine((s) => s.editor.selectedObjectId);
  const scenes = useEngine((s) => s.scenes);
  const currentSceneIndex = useEngine((s) => s.currentSceneIndex);
  const setSelected = useEngine((s) => s.setSelectedObject);

  const scene = scenes[currentSceneIndex];
  const selectedObj = scene?.objects.find((o) => o.id === selectedId);
  const intents = selectedId ? objectIntentMap[selectedId] ?? [] : [];

  const [promptValue, setPromptValue] = useState("");

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleEditor}
        className={`fixed top-5 right-5 z-50 px-4 py-2 rounded-full text-xs font-mono tracking-wider backdrop-blur-md border transition-all duration-300 ${
          editorEnabled
            ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(0,255,255,0.15)]"
            : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
        }`}
      >
        {editorEnabled ? "◆ EDITOR" : "◇ EDIT"}
      </button>

      {/* Editor panel */}
      {editorEnabled && (
        <div className="fixed right-5 top-16 z-50 w-80 max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl p-5 space-y-4 shadow-2xl">
          <div className="text-[10px] font-mono text-white/30 tracking-widest uppercase">
            Visual Direction
          </div>

          {selectedObj ? (
            <>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-white">
                  {selectedObj.label}
                </div>
                <div className="text-[10px] font-mono text-white/30">
                  {selectedObj.id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50">
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-white/25 mb-1">GEOMETRY</div>
                  <div className="text-white/70">{selectedObj.geometry}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-white/25 mb-1">MATERIAL</div>
                  <div className="text-white/70">{selectedObj.material}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-white/25 mb-1">MORPH TO</div>
                  <div className="text-white/70">
                    {selectedObj.morphTo ?? "—"}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-white/25 mb-1">OPACITY</div>
                  <div className="text-white/70">
                    {(selectedObj.opacity * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* AI intent suggestions */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-white/30 tracking-widest uppercase">
                  AI Corrections
                </div>
                {intents.map((intent, i) => (
                  <button
                    key={i}
                    className="w-full text-left text-xs bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-400/20 rounded-lg p-2.5 text-white/60 hover:text-cyan-300 transition-all duration-200 font-mono"
                    onClick={() => setPromptValue(intent)}
                  >
                    &quot;{intent}&quot;
                  </button>
                ))}
              </div>

              {/* Prompt input */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder="Describe a visual change…"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 font-mono focus:outline-none focus:border-cyan-400/40 transition-colors"
                />
                <button className="w-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/20 rounded-lg py-2 text-xs text-cyan-300 font-mono tracking-wider transition-all duration-200">
                  ▶ APPLY DIRECTION
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs text-white/30 font-mono py-8 text-center">
              Click an object on the canvas to inspect and direct it.
            </div>
          )}

          {/* Object list */}
          {scene && (
            <div className="space-y-1 pt-2 border-t border-white/5">
              <div className="text-[10px] font-mono text-white/20 tracking-widest uppercase mb-2">
                Scene Objects
              </div>
              {scene.objects.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() =>
                    setSelected(selectedId === obj.id ? null : obj.id)
                  }
                  className={`w-full text-left text-[11px] font-mono rounded-lg px-3 py-1.5 transition-all duration-200 ${
                    selectedId === obj.id
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/20"
                      : "text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {obj.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
