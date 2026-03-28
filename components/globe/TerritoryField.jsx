"use client";

/**
 * TerritoryField v3 — brumeux, diffus, quasi-invisible de loin
 * Seuls les points (WorkPoint) sont nets. Les territoires sont une brume.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Très subtil — les territoires ne doivent pas dominer
const BIOME_VISUAL = {
  dense:       { fogOp: 0.018, glowOp: 0.055, particles: 8,  psize: 0.018, speed: 1.2, spread: 0.6, pulse: 0.4 },
  atmospheric: { fogOp: 0.028, glowOp: 0.035, particles: 4,  psize: 0.014, speed: 0.2, spread: 1.0, pulse: 0.15 },
  structural:  { fogOp: 0.014, glowOp: 0.045, particles: 6,  psize: 0.016, speed: 0.4, spread: 0.5, pulse: 0.22 },
  narrative:   { fogOp: 0.016, glowOp: 0.040, particles: 6,  psize: 0.016, speed: 0.6, spread: 0.6, pulse: 0.28 },
  hybrid:      { fogOp: 0.018, glowOp: 0.042, particles: 7,  psize: 0.017, speed: 1.0, spread: 0.8, pulse: 0.38 },
};

function FogSphere({ radius, opacity, color, pulse, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * pulse + phase) * 0.04);
  });
  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} side={THREE.BackSide} />
    </mesh>
  );
}

function GlowCore({ radius, opacity, color, pulse, phase }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * pulse * 0.6 + phase + 1) * 0.06);
      ref.current.material.opacity = opacity * (0.7 + Math.sin(clock.elapsedTime * pulse * 0.4 + phase) * 0.3);
    }
  });
  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[radius * 0.45, 12, 12]} />
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
    g.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    return g;
  }, [positions]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t   = clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      pos.array[i*3]   += Math.sin(t * speed * 0.5 + phases[i])       * 0.001;
      pos.array[i*3+1] += Math.cos(t * speed * 0.4 + phases[i] + 1.2) * 0.001;
      pos.array[i*3+2] += Math.sin(t * speed * 0.6 + phases[i] + 2.4) * 0.001;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo} raycast={() => null}>
      <pointsMaterial color={color} size={size} transparent opacity={0.25} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function TerritoryField({ territory, distanceFactor = 0.5 }) {
  if (!territory) return null;
  const { center, radius, strength, biome, density } = territory;
  const vis   = BIOME_VISUAL[biome] || BIOME_VISUAL.structural;
  const color = territory.color || '#ffffff';
  const phase = ((center.x + center.y + center.z) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

  // Plus discret de loin, légèrement plus visible de près
  const boost  = 1 + (1 - distanceFactor) * 0.3;
  const fogOp  = Math.min(0.055, vis.fogOp * boost * (0.4 + strength * 0.8));
  const glowOp = Math.min(0.08,  vis.glowOp * boost * (0.4 + strength * 0.8));
  const pCount = Math.max(2, Math.min(12, Math.floor(vis.particles * (density / 20))));

  return (
    <group position={[center.x, center.y, center.z]}>
      <FogSphere  radius={radius}      opacity={fogOp}  color={color} pulse={vis.pulse} phase={phase} />
      <GlowCore   radius={radius}      opacity={glowOp} color={color} pulse={vis.pulse} phase={phase} />
      <Particles  radius={radius*0.75} color={color} count={pCount}
                  size={vis.psize} speed={vis.speed} spread={vis.spread} phase={phase} />
    </group>
  );
}
