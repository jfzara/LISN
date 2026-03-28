"use client";

export default function GlobeAtmosphere({ dark = true }) {
  return (
    <>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.98, 128, 128]} />
        <meshStandardMaterial
          color={dark ? "#8aa0ff" : "#ffffff"}
          transparent
          opacity={dark ? 0.05 : 0.12}
          roughness={1}
          metalness={0}
        />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.04, 128, 128]} />
        <meshStandardMaterial
          color={dark ? "#5c6cff" : "#f8f0e6"}
          transparent
          opacity={dark ? 0.03 : 0.08}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </>
  );
}