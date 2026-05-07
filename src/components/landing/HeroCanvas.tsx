"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";
import ProxyMesh from "@/components/geometry/ProxyMesh";
import type { SceneObject } from "@/engine/types";

/**
 * Tiny self-contained R3F scene that lives behind the landing hero.
 *
 * It does NOT use the engine store, the scroll choreographer, or any
 * builder UI. It just renders a curated set of alive proxy objects so the
 * hero feels alive without dragging the whole playground onto /.
 *
 * The actual playground / builder lives at /build.
 */

const HERO_OBJECTS: SceneObject[] = [
  {
    id: "hero-cube",
    label: "Hero cube",
    geometry: "box",
    morphTo: "sphere",
    material: "chrome",
    position: [0, 0.2, 0],
    rotation: [0.35, 0.6, 0.1],
    scale: [1.1, 1.1, 1.1],
    color: "#d9f7ff",
    opacity: 1,
    animation: {
      breathe: true,
      pulse: true,
      float: true,
      spin: { axis: "y", speed: 0.18 },
      squashStretch: false,
    },
    visible: true,
  },
  {
    id: "hero-orbit-knot",
    label: "Hologram orbit",
    geometry: "torusKnot",
    material: "hologram",
    position: [1.6, 0.5, -0.8],
    rotation: [0.2, 0.4, 0.1],
    scale: [0.42, 0.42, 0.42],
    color: "#7cffd0",
    opacity: 0.9,
    animation: {
      breathe: true,
      spin: { axis: "x", speed: 0.6 },
      float: true,
    },
    visible: true,
  },
  {
    id: "hero-orbit-ico",
    label: "Glow icosa",
    geometry: "icosahedron",
    material: "glow",
    position: [-1.7, -0.4, -0.3],
    rotation: [0.1, 0.2, 0.0],
    scale: [0.36, 0.36, 0.36],
    color: "#a985ff",
    opacity: 0.85,
    animation: {
      breathe: true,
      pulse: true,
      float: true,
    },
    visible: true,
  },
  {
    id: "hero-anchor",
    label: "Spatial anchor",
    geometry: "torus",
    material: "hologram",
    position: [0, -1.05, 0],
    rotation: [Math.PI / 2, 0, 0],
    scale: [1.5, 1.5, 0.04],
    color: "#4eeaff",
    opacity: 0.55,
    animation: {
      spin: { axis: "z", speed: 0.18 },
      pulse: true,
    },
    visible: true,
  },
];

export default function HeroCanvas() {
  const camera = useMemo(
    () => ({ position: [0, 0.4, 4.2] as [number, number, number], fov: 38 }),
    [],
  );

  return (
    <Canvas
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      dpr={[1, 2]}
      camera={camera}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <color attach="background" args={["#03040a"]} />
      <fog attach="fog" args={["#03040a", 6, 18]} />

      <ambientLight intensity={0.18} />
      <pointLight position={[3, 4, 5]} intensity={0.8} color="#fff" />
      <pointLight position={[-4, 2, -3]} intensity={0.35} color="#6ee7ff" />

      <Suspense fallback={null}>
        <Environment preset="night" />
        {HERO_OBJECTS.map((obj) => (
          <ProxyMesh key={obj.id} object={obj} scrollProgress={0} />
        ))}
        <EffectComposer>
          <Bloom
            intensity={1.0}
            luminanceThreshold={0.16}
            luminanceSmoothing={0.4}
            mipmapBlur
          />
          <Vignette darkness={0.7} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
