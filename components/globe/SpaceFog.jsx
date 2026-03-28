"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export default function SpaceFog({ dark = true }) {
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new THREE.FogExp2(dark ? "#0a0a0f" : "#efe7db", dark ? 0.32 : 0.16);
    return () => {
      scene.fog = null;
    };
  }, [scene, dark]);

  return null;
}