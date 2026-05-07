"use client";

import { useEngine } from "@/engine/store";

/**
 * Small toggle that turns the doodle overlay on. Hides itself when the
 * overlay is open (the overlay's own toolbar provides the exit button).
 */
export default function DoodleToggle() {
  const enabled = useEngine((s) => s.doodle.enabled);
  const editorEnabled = useEngine((s) => s.editor.enabled);
  const toggleDoodle = useEngine((s) => s.toggleDoodle);

  if (enabled) return null;

  // When the editor panel is open, shift left to avoid overlap.
  const offsetClass = editorEnabled ? "right-[22rem]" : "right-32";

  return (
    <button
      onClick={toggleDoodle}
      className={`fixed top-5 z-50 ${offsetClass} px-4 py-2 rounded-full text-xs font-mono tracking-wider backdrop-blur-md border bg-white/5 border-white/10 text-white/50 hover:text-white/90 hover:border-white/20 transition-all duration-300`}
      title="Draw motion / animation directly on the canvas"
    >
      ✎ DRAW
    </button>
  );
}
