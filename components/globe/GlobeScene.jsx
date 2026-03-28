"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import GlobeCore from "./GlobeCore";
import GlobeAtmosphere from "./GlobeAtmosphere";
import TerritoryClouds from "./TerritoryClouds";
import WorkPoint from "./WorkPoint";
import GlobeControls from "./GlobeControls";
import SpaceFog from "./SpaceFog";

function SceneLights({ dark }) {
  return (
    <>
      <ambientLight intensity={dark ? 0.9 : 1.15} />
      <directionalLight
        position={[2.5, 2, 3]}
        intensity={dark ? 1.15 : 1.0}
        color={dark ? "#f3e6d8" : "#ffffff"}
      />
      <directionalLight
        position={[-2, -1, -2]}
        intensity={dark ? 0.25 : 0.35}
        color={dark ? "#7aa2ff" : "#b8d0ff"}
      />
    </>
  );
}

function GlobeContent({ works, dark }) {
  const safeWorks = useMemo(() => {
    return (works || []).map((w, i) => ({
      id: w.id ?? `work-${i}`,
      x: typeof w.x === "number" ? w.x : 0,
      y: typeof w.y === "number" ? w.y : 0,
      z: typeof w.z === "number" ? w.z : 0,
      size: typeof w.size === "number" ? w.size : 0.04,
      color: w.color ?? (dark ? "#f2eee8" : "#1a1a1a"),
    }));
  }, [works, dark]);

  return (
    <>
      <SpaceFog dark={dark} />
      <SceneLights dark={dark} />

      <group>
        <TerritoryClouds dark={dark} />
        <GlobeCore dark={dark} />
        <GlobeAtmosphere dark={dark} />

        {safeWorks.map((w) => (
          <WorkPoint
            key={w.id}
            position={[w.x, w.y, w.z]}
            size={w.size}
            color={w.color}
            dark={dark}
          />
        ))}
      </group>

      <GlobeControls />
    </>
  );
}

export default function GlobeScene({ works = [], dark = true }) {
  return (
    <div
      className="globe-canvas-wrap"
      style={{
        width: "100%",
        height: "100%",
        background: dark
          ? "radial-gradient(circle at 50% 45%, #16141a 0%, #0a0a0f 55%, #050507 100%)"
          : "radial-gradient(circle at 50% 45%, #f8f3ec 0%, #efe7db 48%, #e4d8c9 100%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 42, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <GlobeContent works={works} dark={dark} />
      </Canvas>
    </div>
  );
}