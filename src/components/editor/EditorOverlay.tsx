"use client";

import { useEngine } from "@/engine/store";
import { objectIntentMap } from "@/engine/sceneGraph";
import { useState } from "react";
import type { SceneObject, SceneDefinition } from "@/engine/types";

const SCENE_INTENTS = [
  "Push the camera in slower",
  "Darken the mood and deepen the fog",
  "Add a glowing orb behind the main object",
  "Extend this scene by 30%",
];

export default function EditorOverlay() {
  const editorEnabled = useEngine((s) => s.editor.enabled);
  const toggleEditor = useEngine((s) => s.toggleEditor);
  const selectedId = useEngine((s) => s.editor.selectedObjectId);
  const scenes = useEngine((s) => s.scenes);
  const currentSceneIndex = useEngine((s) => s.currentSceneIndex);
  const setSelected = useEngine((s) => s.setSelectedObject);
  const replaceObject = useEngine((s) => s.replaceObject);
  const removeObject = useEngine((s) => s.removeObject);
  const replaceScene = useEngine((s) => s.replaceScene);
  const setBuilderStatus = useEngine((s) => s.setBuilderStatus);
  const setBuilderError = useEngine((s) => s.setBuilderError);
  const setToast = useEngine((s) => s.setToast);
  const llmProvider = useEngine((s) => s.llm.provider);
  const llmModel = useEngine((s) => s.llm.model);

  const scene = scenes[currentSceneIndex];
  const selectedObj = scene?.objects.find((o) => o.id === selectedId);
  const intents = selectedId ? objectIntentMap[selectedId] ?? [] : [];

  const [promptValue, setPromptValue] = useState("");
  const [target, setTarget] = useState<"object" | "scene">("object");
  const [busy, setBusy] = useState(false);

  async function applyDirection() {
    const instruction = promptValue.trim();
    if (!instruction || busy || !scene) return;

    setBusy(true);
    setBuilderError(null);
    setBuilderStatus("editing");

    try {
      if (target === "object") {
        if (!selectedObj) {
          setToast("Select an object first.");
          setBuilderStatus("idle");
          return;
        }
        const res = await fetch("/api/edit-object", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            object: selectedObj,
            prompt: instruction,
            sceneLabel: scene.label,
            provider: llmProvider,
            model: llmModel ?? undefined,
          }),
        });
        const json = (await res.json()) as {
          object?: SceneObject;
          error?: string;
        };
        if (!res.ok || !json.object) {
          throw new Error(json.error || `Request failed (${res.status})`);
        }
        replaceObject(scene.id, json.object);
        setToast(`Updated "${json.object.label}".`);
        setPromptValue("");
      } else {
        const res = await fetch("/api/edit-scene", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            scene,
            prompt: instruction,
            provider: llmProvider,
            model: llmModel ?? undefined,
          }),
        });
        const json = (await res.json()) as {
          scene?: SceneDefinition;
          error?: string;
        };
        if (!res.ok || !json.scene) {
          throw new Error(json.error || `Request failed (${res.status})`);
        }
        replaceScene(scene.id, json.scene);
        setToast(`Scene "${json.scene.label}" updated.`);
        setPromptValue("");
      }
      setBuilderStatus("idle");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setBuilderError(msg);
      setBuilderStatus("error");
      setToast(`Edit failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  function deleteSelected() {
    if (!scene || !selectedObj) return;
    removeObject(scene.id, selectedObj.id);
    setSelected(null);
    setToast(`Removed "${selectedObj.label}".`);
  }

  return (
    <>
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

      {editorEnabled && (
        <div className="fixed right-5 top-16 z-50 w-80 max-h-[78vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/75 backdrop-blur-xl p-5 space-y-4 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-mono text-white/30 tracking-widest uppercase flex-1">
              Visual Direction
            </div>
            <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-[9px] font-mono">
              {(["object", "scene"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className={`px-2.5 py-1 rounded-full transition-all uppercase tracking-wider ${
                    target === t
                      ? "bg-cyan-300/15 text-cyan-200"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {target === "object" ? (
            selectedObj ? (
              <ObjectInspector
                object={selectedObj}
                intents={intents}
                onIntentClick={setPromptValue}
                onDelete={deleteSelected}
              />
            ) : (
              <div className="text-xs text-white/30 font-mono py-8 text-center">
                Click any object on the canvas to inspect & direct it.
              </div>
            )
          ) : (
            <SceneInspector scene={scene} onIntentClick={setPromptValue} />
          )}

          <div className="space-y-2">
            <textarea
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  applyDirection();
                }
              }}
              placeholder={
                target === "object"
                  ? "Describe a visual change to this object…"
                  : "Describe a change to the whole scene…"
              }
              rows={2}
              disabled={busy}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 font-mono focus:outline-none focus:border-cyan-400/40 transition-colors resize-none"
            />
            <button
              onClick={applyDirection}
              disabled={
                busy ||
                promptValue.trim().length === 0 ||
                (target === "object" && !selectedObj)
              }
              className="w-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/20 hover:border-cyan-400/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg py-2 text-xs text-cyan-300 font-mono tracking-wider transition-all duration-200"
            >
              {busy ? "DIRECTING…" : "▶ APPLY DIRECTION"}
            </button>
          </div>

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

function ObjectInspector({
  object,
  intents,
  onIntentClick,
  onDelete,
}: {
  object: SceneObject;
  intents: string[];
  onIntentClick: (s: string) => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="space-y-1">
        <div className="text-sm font-semibold text-white">{object.label}</div>
        <div className="text-[10px] font-mono text-white/30">{object.id}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-white/25 mb-1">GEOMETRY</div>
          <div className="text-white/70">{object.geometry}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-white/25 mb-1">MATERIAL</div>
          <div className="text-white/70">{object.material}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-white/25 mb-1">MORPH TO</div>
          <div className="text-white/70">{object.morphTo ?? "—"}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-white/25 mb-1">OPACITY</div>
          <div className="text-white/70">
            {(object.opacity * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {intents.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-white/30 tracking-widest uppercase">
            AI Corrections
          </div>
          {intents.map((intent, i) => (
            <button
              key={i}
              className="w-full text-left text-xs bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-400/20 rounded-lg p-2.5 text-white/60 hover:text-cyan-300 transition-all duration-200 font-mono"
              onClick={() => onIntentClick(intent)}
            >
              &quot;{intent}&quot;
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onDelete}
        className="w-full text-[10px] font-mono tracking-widest uppercase text-rose-300/70 hover:text-rose-200 border border-rose-400/10 hover:border-rose-400/30 rounded-lg py-1.5 transition-all"
      >
        ✕ Remove object
      </button>
    </>
  );
}

function SceneInspector({
  scene,
  onIntentClick,
}: {
  scene: SceneDefinition | undefined;
  onIntentClick: (s: string) => void;
}) {
  if (!scene) return null;
  return (
    <>
      <div className="space-y-1">
        <div className="text-sm font-semibold text-white">{scene.label}</div>
        <div className="text-[10px] font-mono text-white/30">{scene.id}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/50">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-white/25 mb-1">DURATION</div>
          <div className="text-white/70">{scene.duration}vh</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-white/25 mb-1">OBJECTS</div>
          <div className="text-white/70">{scene.objects.length}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2 col-span-2">
          <div className="text-white/25 mb-1">DESCRIPTION</div>
          <div className="text-white/70 leading-5">{scene.description}</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-[10px] font-mono text-white/30 tracking-widest uppercase">
          Scene Directions
        </div>
        {SCENE_INTENTS.map((intent, i) => (
          <button
            key={i}
            onClick={() => onIntentClick(intent)}
            className="w-full text-left text-xs bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-400/20 rounded-lg p-2.5 text-white/60 hover:text-cyan-300 transition-all duration-200 font-mono"
          >
            &quot;{intent}&quot;
          </button>
        ))}
      </div>
    </>
  );
}
