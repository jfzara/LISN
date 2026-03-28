"use client";

function Blob({ position, color, size, opacity }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 48, 48]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

export default function TerritoryClouds({ dark = true }) {
  const blobs = dark
    ? [
        { position: [0.45, 0.1, 0.2], color: "#ff8d47", size: 0.32, opacity: 0.11 },
        { position: [-0.42, -0.12, 0.28], color: "#5cb7ff", size: 0.36, opacity: 0.1 },
        { position: [0.18, 0.36, -0.42], color: "#65f0b5", size: 0.29, opacity: 0.09 },
        { position: [-0.22, 0.45, -0.18], color: "#cc8cff", size: 0.27, opacity: 0.08 },
        { position: [0.0, -0.38, -0.12], color: "#ffe27a", size: 0.31, opacity: 0.07 },
      ]
    : [
        { position: [0.45, 0.1, 0.2], color: "#efb07e", size: 0.32, opacity: 0.16 },
        { position: [-0.42, -0.12, 0.28], color: "#9dcff1", size: 0.36, opacity: 0.15 },
        { position: [0.18, 0.36, -0.42], color: "#b8e8cf", size: 0.29, opacity: 0.13 },
        { position: [-0.22, 0.45, -0.18], color: "#d7c1ea", size: 0.27, opacity: 0.12 },
        { position: [0.0, -0.38, -0.12], color: "#f2dfaa", size: 0.31, opacity: 0.1 },
      ];

  return (
    <>
      {blobs.map((b, i) => (
        <Blob key={i} {...b} />
      ))}
    </>
  );
}