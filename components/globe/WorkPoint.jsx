"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import * as THREE from "three";

// ── Couleurs dark mode — lumineuses, émissives ────────────────────
const BIOME_COLOR_DARK = {
  dense:       new THREE.Color("#FF6B2F"),
  atmospheric: new THREE.Color("#4ABFFF"),
  structural:  new THREE.Color("#E8C97A"),
  narrative:   new THREE.Color("#FF9A4D"),
  hybrid:      new THREE.Color("#C07AE8"),
};

// ── Couleurs light mode — pastel clair, légères sur fond ivoire ───
// Problème résolu : les couleurs sombres saturées (#CC4400 etc.)
// sur fond ivoire avec roughness élevé = aspect organique / pustule.
// Solution : couleurs claires désaturées, presque pastel, avec
// une légère émission pour garder l'aspect "bille de lumière".
const BIOME_COLOR_LIGHT = {
  dense:       new THREE.Color("#E8724A"),  // saumon chaud — pas trop sombre
  atmospheric: new THREE.Color("#5BB8E8"),  // bleu ciel clair
  structural:  new THREE.Color("#D4B86A"),  // or doux
  narrative:   new THREE.Color("#E89858"),  // ambre clair
  hybrid:      new THREE.Color("#B87ED4"),  // lilas doux
};

// Couleur de halo — plus claire que le core pour le soft edge
const BIOME_HALO_DARK = {
  dense:       new THREE.Color("#FF9060"),
  atmospheric: new THREE.Color("#80D8FF"),
  structural:  new THREE.Color("#F0DFA0"),
  narrative:   new THREE.Color("#FFBB70"),
  hybrid:      new THREE.Color("#D4A0F0"),
};

const BIOME_HALO_LIGHT = {
  dense:       new THREE.Color("#F0A080"),
  atmospheric: new THREE.Color("#90D0F0"),
  structural:  new THREE.Color("#E8D898"),
  narrative:   new THREE.Color("#F0B880"),
  hybrid:      new THREE.Color("#C8A0E0"),
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
  return 0.018 + t * 0.052;
}

function haloRadii(score) {
  const c = coreRadius(score);
  return {
    // Halo 1 — soft edge immédiat (bords flous)
    h1: c * 1.9,
    // Halo 2 — zone d'influence (scores élevés)
    h2: score >= 9.0 ? c * 3.4 : score >= 8.0 ? c * 2.6 : 0,
    // Halo 3 — aura large (capitales seulement)
    h3: score >= 9.5 ? c * 5.5 : 0,
  };
}

function baseEmissive(score, dark) {
  // Light mode : émission légère pour garder l'aspect lumineux
  // sans les couleurs sombres qui donnaient l'effet "viral"
  if (!dark) return 0.35 + (score - 5.0) * 0.08;
  return 0.65 + (score - 5.0) * 0.18;
}

export default function WorkPoint({
  work, selected, hovered, distanceFactor = 0.5,
  dark = true, onHover, onSelect,
}) {
  const groupRef = useRef();
  const coreRef  = useRef();
  const halo1Ref = useRef();
  const halo2Ref = useRef();
  const halo3Ref = useRef();

  const isActive = selected || hovered;
  useCursor(hovered);

  const { pos, color, haloColor, score, cr, hr, lod } = useMemo(() => {
    const biome    = work.biome || work.regime || "structural";
    const sc       = Number(work.score) || 7.0;
    const palette  = dark ? BIOME_COLOR_DARK  : BIOME_COLOR_LIGHT;
    const haloPal  = dark ? BIOME_HALO_DARK   : BIOME_HALO_LIGHT;
    return {
      pos:       new THREE.Vector3(work.x ?? 0, work.y ?? 0, work.z ?? 0),
      color:     palette[biome]  ?? new THREE.Color("#aaaaaa"),
      haloColor: haloPal[biome]  ?? new THREE.Color("#cccccc"),
      score:     sc,
      cr:        coreRadius(sc),
      hr:        haloRadii(sc),
      lod:       lodThreshold(sc),
    };
  }, [work, dark]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const shouldShow = distanceFactor <= lod;
    if (groupRef.current.visible !== shouldShow) groupRef.current.visible = shouldShow;
    if (!shouldShow) return;

    const t  = clock.elapsedTime;
    const ph = work.phi ?? 0;
    const em = baseEmissive(score, dark);

    if (coreRef.current) {
      const amp   = 0.016 + (score - 5) * 0.003;
      const pulse = 1 + Math.sin(t * 0.85 + ph * 2.5) * amp;
      coreRef.current.scale.setScalar(isActive ? pulse * 1.18 : pulse);
      coreRef.current.material.emissiveIntensity =
        isActive ? em * 1.8 : em + Math.sin(t * 0.55 + ph) * 0.3;
    }

    // Halo 1 — soft edge, opacité faible = bords fondus
    if (halo1Ref.current) {
      const p  = 1 + Math.sin(t * 0.38 + ph) * 0.10;
      // Opacité intentionnellement faible pour l'effet "soft"
      const op = dark
        ? 0.04 + (score - 5) * 0.008
        : 0.06 + (score - 5) * 0.010;
      halo1Ref.current.scale.setScalar(isActive ? p * 1.5 : p);
      halo1Ref.current.material.opacity = isActive ? op * 2.8 : op;
    }

    if (halo2Ref.current) {
      const p  = 1 + Math.sin(t * 0.24 + ph + 1.2) * 0.14;
      const op = dark ? 0.022 : 0.032;
      halo2Ref.current.scale.setScalar(isActive ? p * 1.6 : p);
      halo2Ref.current.material.opacity = Math.max(0, isActive ? op * 2.2 : op);
    }

    if (halo3Ref.current) {
      const p = 1 + Math.sin(t * 0.16 + ph + 2.4) * 0.18;
      halo3Ref.current.scale.setScalar(isActive ? p * 1.8 : p);
      halo3Ref.current.material.opacity = isActive ? 0.055 : 0.012;
    }
  });

  return (
    <group ref={groupRef} position={pos}>

      {/* Halo 3 — aura très large, très transparente (capitales) */}
      {hr.h3 > 0 && (
        <mesh ref={halo3Ref} raycast={() => null}>
          <sphereGeometry args={[hr.h3, 8, 8]} />
          <meshBasicMaterial
            color={haloColor} transparent opacity={0.012} depthWrite={false}
          />
        </mesh>
      )}

      {/* Halo 2 — zone d'influence */}
      {hr.h2 > 0 && (
        <mesh ref={halo2Ref} raycast={() => null}>
          <sphereGeometry args={[hr.h2, 10, 10]} />
          <meshBasicMaterial
            color={haloColor} transparent opacity={0.022} depthWrite={false}
          />
        </mesh>
      )}

      {/* Halo 1 — soft edge immédiat
          Clé : couleur PLUS CLAIRE que le core (haloColor),
          opacité faible, légèrement plus grand que le core.
          Effet : le bord du point paraît flou / fondu. */}
      <mesh ref={halo1Ref} raycast={() => null}>
        <sphereGeometry args={[hr.h1, 12, 12]} />
        <meshBasicMaterial
          color={haloColor}
          transparent
          opacity={dark ? 0.04 + (score-5)*0.008 : 0.06 + (score-5)*0.010}
          depthWrite={false}
        />
      </mesh>

      {/* Core — l'œuvre elle-même
          Light mode : roughness bas + émission légère = bille lumineuse
          (pas de roughness élevé qui donnait l'effet "pustule") */}
      <mesh
        ref={coreRef}
        onPointerOver={e => { e.stopPropagation(); onHover?.(work); }}
        onPointerOut={e  => { e.stopPropagation(); onHover?.(null); }}
        onClick={e       => { e.stopPropagation(); onSelect?.(work); }}
      >
        <sphereGeometry args={[cr, 18, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={baseEmissive(score, dark)}
          roughness={0.15}
          metalness={0.05}
          toneMapped={false}
        />
      </mesh>

      {/* Anneau de sélection */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[hr.h1 * 1.1, hr.h1 * 1.4, 32]} />
          <meshBasicMaterial
            color={haloColor} transparent opacity={0.65}
            side={THREE.DoubleSide} depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
