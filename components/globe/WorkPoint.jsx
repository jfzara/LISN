"use client";

export default function WorkPoint({ position, size = 0.04, color = "#ffffff", dark = true }) {
  const core = Math.max(0.012, size * 0.45);
  const halo = Math.max(core * 1.9, size * 0.9);

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[halo, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={dark ? 0.18 : 0.08}
          transparent
          opacity={dark ? 0.12 : 0.08}
          roughness={1}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[core, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={dark ? 0.7 : 0.2}
          roughness={0.5}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}