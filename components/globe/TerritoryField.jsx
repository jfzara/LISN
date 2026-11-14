"use client";

/**
 * TerritoryField v4 — contenu sur la surface du globe
 *
 * Problème résolu : les sphères BackSide avec grand rayon créaient
 * des dômes colorés visibles dans le vide au-dessus du globe.
 *
 * Solution : tous les objets sont maintenant orientés FrontSide,
 * de petite taille relative, et positionnés proche de la surface.
 * Pas de BackSide = pas de nappe dans le vide.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BIOME_VISUAL = {
  dense:       { fogOp:0.014, glowOp:0.042, particles:6,  psize:0.016, speed:1.0, spread:0.55, pulse:0.38 },
  atmospheric: { fogOp:0.022, glowOp:0.028, particles:3,  psize:0.012, speed:0.18,spread:0.85, pulse:0.14 },
  structural:  { fogOp:0.012, glowOp:0.036, particles:5,  psize:0.014, speed:0.38,spread:0.50, pulse:0.20 },
  narrative:   { fogOp:0.013, glowOp:0.032, particles:5,  psize:0.014, speed:0.55,spread:0.58, pulse:0.26 },
  hybrid:      { fogOp:0.014, glowOp:0.034, particles:6,  psize:0.015, speed:0.90,spread:0.72, pulse:0.36 },
};

function FogBlob({ radius, opacity, color, pulse, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * pulse + phase) * 0.04);
  });
  // FrontSide uniquement — pas de nappe dans le vide
  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[radius, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function GlowCore({ radius, opacity, color, pulse, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * pulse * 0.6 + phase + 1) * 0.05);
    ref.current.material.opacity = opacity * (0.7 + Math.sin(clock.elapsedTime * pulse * 0.4 + phase) * 0.3);
  });
  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[radius * 0.40, 10, 10]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function Particles({ radius, color, count, size, speed, spread, phase }) {
  const ref = useRef();
  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph  = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r  = radius * (0.2 + Math.random() * spread);
      const th = Math.random() * Math.PI;
      const p  = Math.random() * Math.PI * 2;
      pos[i*3]   = r * Math.sin(th) * Math.cos(p);
      pos[i*3+1] = r * Math.cos(th);
      pos[i*3+2] = r * Math.sin(th) * Math.sin(p);
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, phases: ph };
  }, [radius, count, spread]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return g;
  }, [positions]);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t   = clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      pos.array[i*3]   += Math.sin(t*speed*0.5 + phases[i])       * 0.0008;
      pos.array[i*3+1] += Math.cos(t*speed*0.4 + phases[i] + 1.2) * 0.0008;
      pos.array[i*3+2] += Math.sin(t*speed*0.6 + phases[i] + 2.4) * 0.0008;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo} raycast={() => null}>
      <pointsMaterial color={color} size={size} transparent opacity={0.08} sizeAttenuation depthWrite={false} />
    </points>
  );
}

import { useEffect } from "react";

// Lavis : dégradé radial doux, partagé par tous les territoires
let _wash = null;
function washTexture() {
  if (_wash || typeof document === "undefined") return _wash;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.5, "rgba(255,255,255,0.22)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  _wash = new THREE.CanvasTexture(c);
  return _wash;
}

export default function TerritoryField({ territory, distanceFactor = 0.5, dark = true }) {
  if (!territory) return null;
  const { center, radius, strength, biome, density } = territory;
  const vis   = BIOME_VISUAL[biome] || BIOME_VISUAL.structural;
  const color = territory.color || "#ffffff";
  const phase = ((center.x + center.y + center.z) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);

  // Rayon max = 1.2 unités — pas de dôme géant
  const r      = Math.min(radius * 0.55, 1.2);
  const boost  = 1 + (1 - distanceFactor) * 0.25;
  const fogOp  = Math.min(0.045, vis.fogOp  * boost * (0.3 + strength * 0.9));
  const glowOp = Math.min(0.065, vis.glowOp * boost * (0.3 + strength * 0.9));
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), new THREE.Vector3(center.x, center.y, center.z).normalize());
  const pCount = Math.max(2, Math.min(8, Math.floor(vis.particles * (density / 18))));

  return (
    <group position={[center.x * 1.012, center.y * 1.012, center.z * 1.012]} quaternion={quat}>
      <mesh raycast={() => null}>
        <circleGeometry args={[r * 2.1, 48]} />
        <meshBasicMaterial map={washTexture()} color={dark ? "#1226f0" : "#000000"} transparent opacity={dark ? 0.7 : 0.28}
          depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
