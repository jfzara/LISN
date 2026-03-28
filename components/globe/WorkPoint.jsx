"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import * as THREE from "three";

const BIOME_COLOR = {
  dense:       new THREE.Color("#FF6B2F"),
  atmospheric: new THREE.Color("#4ABFFF"),
  structural:  new THREE.Color("#E8C97A"),
  narrative:   new THREE.Color("#FF9A4D"),
  hybrid:      new THREE.Color("#C07AE8"),
};

function lodThreshold(score) {
  if (score >= 9.3) return 1.00;
  if (score >= 8.8) return 0.90;
  if (score >= 8.0) return 0.72;
  if (score >= 7.2) return 0.55;
  return 0.38;
}

function coreRadius(score) {
  const t = Math.max(0, Math.min(1, (score - 5.0) / 5.0));
  return 0.016 + t * 0.048;
}

function haloRadii(score) {
  const c = coreRadius(score);
  return {
    h1: c * 1.8,
    h2: score >= 9.0 ? c * 2.8 : 0,
    h3: score >= 9.6 ? c * 4.0 : 0,
  };
}

function baseEmissive(score) {
  return 0.65 + (score - 5.0) * 0.18;
}

export default function WorkPoint({
  work,
  selected,
  hovered,
  distanceFactor = 0.5,
  onHover,
  onSelect,
}) {
  // ── Tous les hooks TOUJOURS appelés, sans exception ────────────
  const groupRef = useRef();
  const coreRef  = useRef();
  const halo1Ref = useRef();
  const halo2Ref = useRef();
  const halo3Ref = useRef();

  const isActive = selected || hovered;
  useCursor(hovered);

  const { pos, color, score, cr, hr, lod } = useMemo(() => {
    const biome = work.biome || work.regime || "structural";
    const sc    = Number(work.score) || 7.0;
    return {
      pos:   new THREE.Vector3(work.x ?? 0, work.y ?? 0, work.z ?? 0),
      color: BIOME_COLOR[biome] ?? new THREE.Color("#ffffff"),
      score: sc,
      cr:    coreRadius(sc),
      hr:    haloRadii(sc),
      lod:   lodThreshold(sc),
    };
  }, [work]);

  // useFrame TOUJOURS appelé — visibilité gérée via group.visible
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // LOD : masquer via visible, jamais via return/unmount
    const shouldShow = distanceFactor <= lod;
    if (groupRef.current.visible !== shouldShow) {
      groupRef.current.visible = shouldShow;
    }
    if (!shouldShow) return;

    const t  = clock.elapsedTime;
    const ph = work.phi ?? 0;
    const em = baseEmissive(score);

    if (coreRef.current) {
      const amp = 0.018 + (score - 5) * 0.003;
      const pulse = 1 + Math.sin(t * 0.85 + ph * 2.5) * amp;
      coreRef.current.scale.setScalar(isActive ? pulse * 1.18 : pulse);
      coreRef.current.material.emissiveIntensity =
        isActive ? em * 1.7 : em + Math.sin(t * 0.55 + ph) * 0.5;
    }
    if (halo1Ref.current) {
      const p    = 1 + Math.sin(t * 0.38 + ph) * 0.12;
      const baseOp = 0.05 + (score - 5) * 0.010;
      halo1Ref.current.scale.setScalar(isActive ? p * 1.4 : p);
      halo1Ref.current.material.opacity =
        isActive ? baseOp * 2.2 : baseOp + Math.sin(t * 0.32 + ph) * 0.04;
    }
    if (halo2Ref.current) {
      const p    = 1 + Math.sin(t * 0.24 + ph + 1.2) * 0.16;
      const baseOp = 0.025 + (score - 8.8) * 0.008;
      halo2Ref.current.scale.setScalar(isActive ? p * 1.5 : p);
      halo2Ref.current.material.opacity =
        isActive ? baseOp * 2.0 : Math.max(0, baseOp + Math.sin(t * 0.22 + ph) * 0.02);
    }
    if (halo3Ref.current) {
      const p = 1 + Math.sin(t * 0.16 + ph + 2.4) * 0.20;
      halo3Ref.current.scale.setScalar(isActive ? p * 1.6 : p);
      halo3Ref.current.material.opacity =
        isActive ? 0.06 : 0.015 + Math.sin(t * 0.18 + ph) * 0.01;
    }
  });

  // ── Rendu — group toujours monté, visible contrôlé par useFrame ─
  return (
    <group ref={groupRef} position={pos}>
      {hr.h3 > 0 && (
        <mesh ref={halo3Ref} raycast={() => null}>
          <sphereGeometry args={[hr.h3, 10, 10]} />
          <meshBasicMaterial color={color} transparent opacity={0.025} depthWrite={false} />
        </mesh>
      )}

      {hr.h2 > 0 && (
        <mesh ref={halo2Ref} raycast={() => null}>
          <sphereGeometry args={[hr.h2, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.04} depthWrite={false} />
        </mesh>
      )}

      <mesh ref={halo1Ref} raycast={() => null}>
        <sphereGeometry args={[hr.h1, 14, 14]} />
        <meshBasicMaterial
          color={color} transparent
          opacity={0.05 + (score - 5) * 0.010}
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={coreRef}
        onPointerOver={e => { e.stopPropagation(); onHover?.(work); }}
        onPointerOut={e  => { e.stopPropagation(); onHover?.(null); }}
        onClick={e       => { e.stopPropagation(); onSelect?.(work); }}
      >
        <sphereGeometry args={[cr, 14, 14]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={baseEmissive(score)}
          toneMapped={false}
        />
      </mesh>

      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[hr.h1 * 1.1, hr.h1 * 1.4, 32]} />
          <meshBasicMaterial
            color={color} transparent opacity={0.55}
            side={THREE.DoubleSide} depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
