"use client";

import { useEffect } from "react";
import { useEngine } from "@/engine/store";

export default function Toaster() {
  const toast = useEngine((s) => s.builder.toast);
  const setToast = useEngine((s) => s.setToast);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
      <div className="rounded-full border border-cyan-300/30 bg-black/70 backdrop-blur-xl px-4 py-2 shadow-[0_0_24px_rgba(110,200,255,0.18)]">
        <span className="text-[11px] font-mono tracking-wider text-cyan-100">
          {toast}
        </span>
      </div>
    </div>
  );
}
