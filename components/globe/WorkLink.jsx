"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BIOME_COLOR = {
  dense:       "#FF6B2F",
  atmospheric: "#4ABFFF",
  structural:  "#E8C97A",
  narrative:   "#FF9A4D",
  hybrid:      "#C07AE8",
};

const ARC_SEGMENTS = 20;

function buildArc(posA, posB) {
  const r = posA.length();
  const points = [];
  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const v = new THREE.Vector3().lerpVectors(posA, posB, i / ARC_SEGMENTS);
    v.setLength(r + 0.12);
    points.push(v.clone());
  }
  return points;
}

export default function WorkLink({
  workA,
  workB,
  distanceFactor = 0.5,
  isHighlighted  = false,
  strength       = 0.5,
  isBridge       = false,
}) {
  // Tous les hooks toujours appelés
  const lineRef = useRef();

  const { geometry, color, baseOpacity } = useMemo(() => {
    if (!workA || !workB) {
      return {
        geometry: new THREE.BufferGeometry(),
        color: "#ffffff",
        baseOpacity: 0,
      };
    }
    const posA = new THREE.Vector3(workA.x ?? 0, workA.y ?? 0, workA.z ?? 0);
    const posB = new THREE.Vector3(workB.x ?? 0, workB.y ?? 0, workB.z ?? 0);
    const biome = workA.biome || workA.regime || "structural";
    const col   = isBridge ? "#cccccc" : (BIOME_COLOR[biome] || "#aaaaaa");
    const op    = isBridge ? 0.18 + strength * 0.12 : 0.06 + strength * 0.18;
    return {
      geometry:    new THREE.BufferGeometry().setFromPoints(buildArc(posA, posB)),
      color:       col,
      baseOpacity: op,
    };
  }, [workA, workB, isBridge, strength]);

  // useFrame toujours appelé — visibilité et opacité via material
  useFrame(({ clock }) => {
    if (!lineRef.current) return;

    // LOD : ponts visibles jusqu'à df=0.88, autres jusqu'à df=0.52
    const shouldShow = isBridge ? distanceFactor < 0.88 : distanceFactor < 0.52;
    lineRef.current.visible = shouldShow;
    if (!shouldShow) return;

    if (isHighlighted) {
      lineRef.current.material.opacity =
        Math.min(0.9, baseOpacity * 4 * (0.7 + Math.sin(clock.elapsedTime * 2.2) * 0.3));
    } else {
      lineRef.current.material.opacity = baseOpacity;
    }
  });

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={baseOpacity}
        depthWrite={false}
      />
    </line>
  );
}
