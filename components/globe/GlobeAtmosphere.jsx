"use client";

export default function GlobeAtmosphere({ dark = true }) {
  return (
    <>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.98, 128, 128]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0}
          roughness={1}
          metalness={0}
        />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.04, 128, 128]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </>
  );
}