"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEngine } from "@/engine/store";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollChoreographer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scenes = useEngine((s) => s.scenes);
  const setScrollProgress = useEngine((s) => s.setScrollProgress);
  const setGlobalProgress = useEngine((s) => s.setGlobalProgress);
  const setCurrentSceneIndex = useEngine((s) => s.setCurrentSceneIndex);

  useEffect(() => {
    if (!containerRef.current || scenes.length === 0) return;

    const totalDuration = scenes.reduce((s, sc) => s + sc.duration, 0);

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.8,
      onUpdate: (self) => {
        const globalP = self.progress;
        setGlobalProgress(globalP);

        let acc = 0;
        for (let i = 0; i < scenes.length; i++) {
          const sceneFrac = scenes[i].duration / totalDuration;
          if (globalP <= acc + sceneFrac) {
            setCurrentSceneIndex(i);
            const localP = (globalP - acc) / sceneFrac;
            setScrollProgress(Math.max(0, Math.min(1, localP)));
            break;
          }
          acc += sceneFrac;
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, [scenes, setScrollProgress, setGlobalProgress, setCurrentSceneIndex]);

  const totalVh = scenes.reduce((s, sc) => s + sc.duration, 0);

  return (
    <div
      ref={containerRef}
      style={{ height: `${totalVh}vh` }}
      className="absolute inset-x-0 top-0 z-0 pointer-events-none"
    />
  );
}
