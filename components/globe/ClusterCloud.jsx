"use client";

/**
 * ClusterCloud v3 — nuage très doux, quasi-brumeux
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function CloudBlob({ radius, opacity, color, phase, pulse }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * pulse + phase) * 0.06);
  });
  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[radius, 14, 14]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function CapitalRing({ radius, opacity, color, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.material.opacity = opacity * (0.6 + Math.sin(clock.elapsedTime * 0.18 + phase) * 0.4);
  });
  return (
    <mesh ref={ref} raycast={() => null} rotation={[Math.PI / 5, 0, Math.PI / 9]}>
      <ringGeometry args={[radius * 0.88, radius * 1.02, 48]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

export default function ClusterCloud({ cluster, distanceFactor = 0.5 }) {
  if (!cluster) return null;
  const { center, radius, hasCapital, density } = cluster;
  const color = cluster.color || '#ffffff';
  const phase = ((center.x * 1.3 + center.z * 0.7) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);

  // Fenêtre de visibilité : zoom moyen uniquement
  const visible = distanceFactor > 0.12 && distanceFactor < 0.80;
  if (!visible) return null;

  const fadeIn  = Math.min(1, (distanceFactor - 0.12) / 0.12);
  const fadeOut = Math.min(1, (0.80 - distanceFactor) / 0.12);
  const fade    = Math.min(fadeIn, fadeOut);

  const r      = radius * 0.30;
 const cloudOp = (0.008 + density * 0.0008) * fade;
  const ringOp  = (hasCapital ? 0.045 : 0) * fade;

  return (
    <group position={[center.x, center.y, center.z]}>
      <CloudBlob radius={r}        opacity={Math.max(0, cloudOp)}       color={color} phase={phase}     pulse={0.22} />
      <CloudBlob radius={r * 0.4}  opacity={Math.max(0, cloudOp * 1.6)} color={color} phase={phase+1.2} pulse={0.30} />
      {hasCapital && (
        <CapitalRing radius={r} opacity={Math.max(0, ringOp)} color={color} phase={phase} />
      )}
    </group>
  );
}
