"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneObject, GeometryKind, MaterialPreset } from "@/engine/types";
import { useEngine } from "@/engine/store";

/* ------------------------------------------------------------------ */
/*  Geometry factory                                                   */
/* ------------------------------------------------------------------ */
function makeGeometry(kind: GeometryKind): THREE.BufferGeometry {
  switch (kind) {
    case "box":
      return new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
    case "sphere":
      return new THREE.SphereGeometry(0.65, 48, 32);
    case "torus":
      return new THREE.TorusGeometry(0.55, 0.18, 24, 64);
    case "torusKnot":
      return new THREE.TorusKnotGeometry(0.45, 0.15, 128, 24);
    case "capsule":
      return new THREE.CapsuleGeometry(0.35, 0.7, 16, 32);
    case "cone":
      return new THREE.ConeGeometry(0.5, 1, 32);
    case "cylinder":
      return new THREE.CylinderGeometry(0.4, 0.4, 1, 32);
    case "octahedron":
      return new THREE.OctahedronGeometry(0.6, 2);
    case "icosahedron":
      return new THREE.IcosahedronGeometry(0.6, 2);
    case "dodecahedron":
      return new THREE.DodecahedronGeometry(0.6, 1);
    default:
      return new THREE.BoxGeometry();
  }
}

/* ------------------------------------------------------------------ */
/*  Material factory                                                   */
/* ------------------------------------------------------------------ */
function makeMaterial(
  preset: MaterialPreset,
  color: string,
  opacity: number,
): THREE.Material {
  const c = new THREE.Color(color);
  switch (preset) {
    case "chrome":
      return new THREE.MeshStandardMaterial({
        color: c,
        metalness: 0.97,
        roughness: 0.04,
        envMapIntensity: 2.4,
        transparent: opacity < 1,
        opacity,
      });
    case "glass":
      return new THREE.MeshPhysicalMaterial({
        color: c,
        transmission: 0.85,
        roughness: 0.02,
        ior: 1.5,
        thickness: 0.5,
        transparent: true,
        opacity: Math.min(opacity, 0.82),
      });
    case "glow":
      return new THREE.MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 2.4,
        metalness: 0.2,
        roughness: 0.3,
        transparent: opacity < 1,
        opacity,
      });
    case "wireframe":
      return new THREE.MeshStandardMaterial({
        color: c,
        wireframe: true,
        transparent: opacity < 1,
        opacity,
        emissive: c,
        emissiveIntensity: 0.6,
      });
    case "hologram":
      return new THREE.MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 1.1,
        transparent: true,
        opacity: Math.min(opacity, 0.38),
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    case "emissive":
      return new THREE.MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 3.2,
        metalness: 0.1,
        roughness: 0.2,
        transparent: opacity < 1,
        opacity,
      });
    case "matte":
    default:
      return new THREE.MeshStandardMaterial({
        color: c,
        metalness: 0.05,
        roughness: 0.85,
        transparent: opacity < 1,
        opacity,
      });
  }
}

/* ------------------------------------------------------------------ */
/*  Ease & spring helpers                                              */
/* ------------------------------------------------------------------ */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  object: SceneObject;
  scrollProgress: number;
}

export default function ProxyMesh({ object, scrollProgress }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const editorEnabled = useEngine((s) => s.editor.enabled);
  const selectedId = useEngine((s) => s.editor.selectedObjectId);
  const setSelected = useEngine((s) => s.setSelectedObject);
  const setHoveredObj = useEngine((s) => s.setHoveredObject);

  const baseGeo = useMemo(() => makeGeometry(object.geometry), [object.geometry]);
  const morphGeo = useMemo(
    () => (object.morphTo ? makeGeometry(object.morphTo) : null),
    [object.morphTo],
  );
  const material = useMemo(
    () => makeMaterial(object.material, object.color, object.opacity),
    [object.material, object.color, object.opacity],
  );

  const isSelected = selectedId === object.id;

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    const a = object.animation;

    let sx = object.scale[0];
    let sy = object.scale[1];
    let sz = object.scale[2];

    // Breathe: gentle scale oscillation
    if (a.breathe) {
      const b = 1 + Math.sin(t * 1.2) * 0.04;
      sx *= b;
      sy *= b;
      sz *= b;
    }

    // Pulse: emissive intensity oscillation
    if (a.pulse && "emissiveIntensity" in material) {
      (material as THREE.MeshStandardMaterial).emissiveIntensity =
        2.0 + Math.sin(t * 2.4) * 1.0;
    }

    // Float: y-axis bobbing
    if (a.float) {
      mesh.position.y = object.position[1] + Math.sin(t * 0.9) * 0.18;
    }

    // Spin
    if (a.spin) {
      const axis = a.spin.axis;
      mesh.rotation[axis] += a.spin.speed * 0.016;
    }

    // Squash & stretch
    if (a.squashStretch) {
      const ss = Math.sin(t * 1.8) * 0.06;
      sy *= 1 + ss;
      sx *= 1 - ss * 0.5;
      sz *= 1 - ss * 0.5;
    }

    // Wobble
    if (a.wobble) {
      mesh.rotation.x += Math.sin(t * 2.1) * 0.002;
      mesh.rotation.z += Math.cos(t * 1.7) * 0.002;
    }

    mesh.scale.set(sx, sy, sz);

    // Morph geometry via scroll progress
    if (morphGeo && scrollProgress > 0.5) {
      const morphT = Math.min((scrollProgress - 0.5) * 2, 1);
      const smoothT = morphT * morphT * (3 - 2 * morphT);
      interpolateGeometry(mesh.geometry, baseGeo, morphGeo, smoothT);
    }

    // Editor highlight
    if (editorEnabled && isSelected) {
      (material as THREE.MeshStandardMaterial).emissive = new THREE.Color("#fff");
      (material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(t * 4) * 0.15;
    }
  });

  const handlePointer = (e: { stopPropagation: () => void }) => {
    if (!editorEnabled) return;
    e.stopPropagation();
    setSelected(isSelected ? null : object.id);
  };

  return (
    <mesh
      ref={meshRef}
      geometry={baseGeo}
      material={material}
      position={object.position}
      rotation={object.rotation}
      onClick={handlePointer}
      onPointerOver={(e) => {
        if (!editorEnabled) return;
        e.stopPropagation();
        setHoveredObj(object.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (!editorEnabled) return;
        setHoveredObj(null);
        document.body.style.cursor = "default";
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Geometry interpolation (morph engine core)                         */
/* ------------------------------------------------------------------ */
function interpolateGeometry(
  target: THREE.BufferGeometry,
  from: THREE.BufferGeometry,
  to: THREE.BufferGeometry,
  t: number,
) {
  const fromPos = from.attributes.position;
  const toPos = to.attributes.position;
  const targetPos = target.attributes.position;
  if (!fromPos || !toPos || !targetPos) return;

  const count = Math.min(fromPos.count, toPos.count, targetPos.count);
  for (let i = 0; i < count; i++) {
    const x = lerp(fromPos.getX(i), toPos.getX(i), t);
    const y = lerp(fromPos.getY(i), toPos.getY(i), t);
    const z = lerp(fromPos.getZ(i), toPos.getZ(i), t);
    targetPos.setXYZ(i, x, y, z);
  }
  targetPos.needsUpdate = true;
  target.computeVertexNormals();
}
