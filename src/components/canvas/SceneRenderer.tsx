"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useEngine } from "@/engine/store";
import ProxyMesh from "@/components/geometry/ProxyMesh";
import { Environment } from "@react-three/drei";

export default function SceneRenderer() {
  const scenes = useEngine((s) => s.scenes);
  const currentSceneIndex = useEngine((s) => s.currentSceneIndex);
  const scrollProgress = useEngine((s) => s.scrollProgress);
  const scene = scenes[currentSceneIndex];
  const { camera } = useThree();
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!scene) return;
    const t = scrollProgress;
    const { start, end } = scene.camera;

    const pos = start.position.map(
      (v, i) => v + (end.position[i] - v) * t,
    ) as [number, number, number];
    camera.position.set(...pos);

    const la = start.lookAt.map(
      (v, i) => v + (end.lookAt[i] - v) * t,
    ) as [number, number, number];
    camera.lookAt(...la);

    if (start.fov != null && end.fov != null && camera instanceof THREE.PerspectiveCamera) {
      camera.fov = start.fov + (end.fov - start.fov) * t;
      camera.updateProjectionMatrix();
    }
  });

  if (!scene) return null;

  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight
        ref={lightRef}
        position={[3, 4, 5]}
        intensity={0.8}
        color="#fff"
      />
      <pointLight position={[-4, 2, -3]} intensity={0.35} color="#6ee7ff" />
      <Environment preset="night" />

      {scene.objects
        .filter((o) => o.visible)
        .map((obj) => (
          <ProxyMesh
            key={obj.id}
            object={obj}
            scrollProgress={scrollProgress}
          />
        ))}
    </>
  );
}
