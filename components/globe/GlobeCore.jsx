"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function GlobeCore({ dark = true }) {
  const ref = useRef(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.0007;
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[0.92, 128, 128]} />
      <meshStandardMaterial
        color={dark ? "#121116" : "#ddd2c3"}
        emissive={dark ? "#0c0b10" : "#e9dfd0"}
        emissiveIntensity={dark ? 0.22 : 0.08}
        roughness={0.92}
        metalness={0.02}
      />
    </mesh>
  );
}