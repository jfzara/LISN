"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function GlobeControls() {
  const { camera, gl } = useThree();

  const velocity = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const spherical = useRef(new THREE.Spherical());

  useEffect(() => {
    spherical.current.setFromVector3(camera.position);
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;

    function onPointerDown(e) {
      isDragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
    }

    function onPointerUp() {
      isDragging.current = false;
    }

    function onPointerMove(e) {
      if (!isDragging.current) return;

      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;

      velocity.current.x = dx * 0.0038;
      velocity.current.y = dy * 0.0032;

      last.current = { x: e.clientX, y: e.clientY };
    }

    function onWheel(e) {
      e.preventDefault();
      spherical.current.radius += e.deltaY * 0.0025;
      spherical.current.radius = Math.max(1.6, Math.min(4.8, spherical.current.radius));
    }

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl]);

  useFrame(() => {
    spherical.current.theta -= velocity.current.x;
    spherical.current.phi += velocity.current.y;

    spherical.current.phi = Math.max(0.55, Math.min(Math.PI - 0.55, spherical.current.phi));

    camera.position.setFromSpherical(spherical.current);
    camera.lookAt(0, 0, 0);

    velocity.current.x *= 0.95;
    velocity.current.y *= 0.95;
  });

  return null;
}