"use client";

/**
 * TerritoryField v2 — territoire LISN
 * Correction : aucun hook dans le composant parent (juste du JSX conditionnel).
 * Les hooks sont tous dans les sous-composants leaf — jamais de return null avant un hook.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BIOME_VISUAL = {
  dense: {
    fogOpacity: 0.055, glowOpacity: 0.18, glowScale: 0.70,
    particleCount: 24, particleSize: 0.035, particleSpeed: 1.8, particleSpread: 0.55,
    pulserate: 0.55,
  },
  atmospheric: {
    fogOpacity: 0.080, glowOpacity: 0.09, glowScale: 1.20,
    particleCount: 8, particleSize: 0.028, particleSpeed: 0.35, particleSpread: 0.90,
    pulserate: 0.18,
  },
  structural: {
    fogOpacity: 0.042, glowOpacity: 0.14, glowScale: 0.80,
    particleCount: 14, particleSize: 0.030, particleSpeed: 0.60, particleSpread: 0.60,
    pulserate: 0.28,
  },
  narrative: {
    fogOpacity: 0.048, glowOpacity: 0.12, glowScale: 0.90,
    particleCount: 16, particleSize: 0.032, particleSpeed: 0.90, particleSpread: 0.70,
    pulserate: 0.35,
  },
  hybrid: {
    fogOpacity: 0.050, glowOpacity: 0.11, glowScale: 1.05,
    particleCount: 18, particleSize: 0.034, particleSpeed: 1.40, particleSpread: 0.85,
    pulserate: 0.48,
  },
};

// ── Fog sphérique ─────────────────────────────────────────────────
function FogSphere({ radius, opacity, color, pulserate, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.scale.setScalar(
        1 + Math.sin(clock.elapsedTime * pulserate + phase) * 0.06
      );
    }
  });
  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[radius, 20, 20]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} side={THREE.BackSide} />
    </mesh>
  );
}

// ── Halo de luminosité ────────────────────────────────────────────
function GlowHalo({ radius, opacity, color, strength, pulserate, phase, scale }) {
  const ref = useRef();
  const r   = radius * scale;
  const op  = opacity * (0.5 + strength * 0.7);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.scale.setScalar(
      1 + Math.sin(clock.elapsedTime * pulserate * 0.7 + phase + 1.0) * 0.10
    );
    ref.current.material.opacity =
      op * (0.8 + Math.sin(clock.elapsedTime * pulserate * 0.5 + phase) * 0.2);
  });
  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[r, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={op} depthWrite={false} />
    </mesh>
  );
}

// ── Particules de densité ─────────────────────────────────────────
function DensityParticles({ radius, color, count, size, speed, spread, phase }) {
  const pointsRef = useRef();

  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph  = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r  = radius * (0.3 + Math.random() * spread);
      const th = Math.random() * Math.PI;
      const ph2 = Math.random() * Math.PI * 2;
      pos[i*3]   = r * Math.sin(th) * Math.cos(ph2);
      pos[i*3+1] = r * Math.cos(th);
      pos[i*3+2] = r * Math.sin(th) * Math.sin(ph2);
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, phases: ph };
  }, [radius, count, spread]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.elapsedTime;
    const pos = pointsRef.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      pos.array[i*3]   += Math.sin(t * speed * 0.6 + phases[i])       * 0.002;
      pos.array[i*3+1] += Math.cos(t * speed * 0.5 + phases[i] + 1.2) * 0.002;
      pos.array[i*3+2] += Math.sin(t * speed * 0.7 + phases[i] + 2.4) * 0.002;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} raycast={() => null}>
      <pointsMaterial color={color} size={size} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── TerritoryField — aucun hook ici, seulement du JSX conditionnel ──
export default function TerritoryField({ territory, distanceFactor = 0.5 }) {
  // PAS de hook avant ce guard — les hooks sont tous dans les sous-composants
  if (!territory) return null;

  const { center, radius, strength, biome, density } = territory;
  const vis   = BIOME_VISUAL[biome] || BIOME_VISUAL.structural;
  const color = territory.color || "#ffffff";
  const phase = ((center.x + center.y + center.z) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  const proximityBoost  = 1 + (1 - distanceFactor) * 0.4;
  const scaledFogOp     = Math.min(0.18, vis.fogOpacity * proximityBoost);
  const particleCount   = Math.min(30, Math.max(4, Math.floor(vis.particleCount * (density / 15))));

  return (
    <group position={[center.x, center.y, center.z]}>
      <FogSphere
        radius={radius}
        opacity={scaledFogOp}
        color={color}
        pulserate={vis.pulserate}
        phase={phase}
      />
      <GlowHalo
        radius={radius}
        opacity={vis.glowOpacity}
        color={color}
        strength={strength}
        pulserate={vis.pulserate}
        phase={phase}
        scale={vis.glowScale}
      />
      <DensityParticles
        radius={radius * 0.80}
        color={color}
        count={particleCount}
        size={vis.particleSize}
        speed={vis.particleSpeed}
        spread={vis.particleSpread}
        phase={phase}
      />
    </group>
  );
}
