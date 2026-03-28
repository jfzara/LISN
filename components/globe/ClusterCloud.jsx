"use client";

/**
 * ClusterCloud v2 — région du globe LISN
 * Correction : aucun hook dans le parent, tous dans les sous-composants leaf.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function CloudSphere({ radius, opacity, color, phase, pulserate }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.scale.setScalar(
        1 + Math.sin(clock.elapsedTime * pulserate + phase) * 0.08
      );
    }
  });
  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function CapitalRing({ radius, opacity, color, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.opacity =
        opacity * (0.8 + Math.sin(clock.elapsedTime * 0.22 + phase) * 0.2);
    }
  });
  return (
    <mesh ref={ref} raycast={() => null} rotation={[Math.PI / 6, 0, Math.PI / 8]}>
      <ringGeometry args={[radius * 0.90, radius * 1.05, 48]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// ── ClusterCloud — aucun hook ici ────────────────────────────────
export default function ClusterCloud({ cluster, distanceFactor = 0.5 }) {
  // PAS de hook avant ce guard
  if (!cluster) return null;

  const { center, radius, biome, density, hasCapital } = cluster;
  const color = cluster.color || "#ffffff";
  const phase = ((center.x * 1.3 + center.z * 0.7) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

  // Visible seulement en zoom moyen
  const visible = distanceFactor > 0.15 && distanceFactor < 0.82;
  if (!visible) return null;

  const fadeIn = Math.min(1, (distanceFactor - 0.15) / 0.15);
  const fadeOut = Math.min(1, (0.82 - distanceFactor) / 0.15);
  const fade = Math.min(fadeIn, fadeOut);

  const cloudR   = radius * 0.65;
  const cloudOp  = (0.04 + density * 0.003) * fade;
  const ringOp   = (hasCapital ? 0.12 : 0.07) * fade;
  const pulserate = 0.28;

  return (
    <group position={[center.x, center.y, center.z]}>
      {/* Nuage principal */}
      <CloudSphere
        radius={cloudR}
        opacity={Math.max(0, cloudOp)}
        color={color}
        phase={phase}
        pulserate={pulserate}
      />
      {/* Noyau intérieur */}
      <CloudSphere
        radius={cloudR * 0.45}
        opacity={Math.max(0, cloudOp * 2.0)}
        color={color}
        phase={phase + 1.2}
        pulserate={pulserate * 1.4}
      />
      {/* Anneau pour capitales */}
      {hasCapital && (
        <CapitalRing
          radius={cloudR}
          opacity={Math.max(0, ringOp)}
          color={color}
          phase={phase}
        />
      )}
    </group>
  );
}
