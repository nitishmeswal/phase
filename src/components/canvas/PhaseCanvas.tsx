"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import SceneRenderer from "./SceneRenderer";
import { useEngine } from "@/engine/store";
import {
  EffectComposer,
  Bloom,
  Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";

function PostEffects() {
  const currentSceneIndex = useEngine((s) => s.currentSceneIndex);
  const scenes = useEngine((s) => s.scenes);
  const scene = scenes[currentSceneIndex];
  const pp = scene?.postprocessing;
  if (!pp) return null;

  return (
    <EffectComposer>
      <Bloom
        intensity={pp.bloom?.intensity ?? 1}
        luminanceThreshold={pp.bloom?.luminanceThreshold ?? 0.15}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <Vignette darkness={pp.vignette?.darkness ?? 0.5} />
    </EffectComposer>
  );
}

export default function PhaseCanvas() {
  const scenes = useEngine((s) => s.scenes);
  const currentSceneIndex = useEngine((s) => s.currentSceneIndex);
  const scene = scenes[currentSceneIndex];

  if (!scene) return null;

  return (
    <Canvas
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      dpr={[1, 2]}
      camera={{
        position: scene.camera.start.position,
        fov: scene.camera.start.fov ?? 40,
        near: 0.1,
        far: 100,
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
      }}
    >
      <color attach="background" args={[scene.background]} />
      {scene.fog && (
        <fog
          attach="fog"
          args={[scene.fog.color, scene.fog.near, scene.fog.far]}
        />
      )}

      <Suspense fallback={null}>
        <SceneRenderer />
        <PostEffects />
      </Suspense>
    </Canvas>
  );
}
