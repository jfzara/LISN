"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";

import { buildGlobeModel } from "@/lib/lisn/buildGlobeModel";
import { worksSeed }       from "@/data/worksSeed";
import WorkPoint           from "./WorkPoint";
import WorkLink            from "./WorkLink";
import TerritoryField      from "./TerritoryField";
import ClusterCloud        from "./ClusterCloud";

// ── Modèle géographique — une seule fois ──────────────────────────
const GLOBE_MODEL = buildGlobeModel(worksSeed);
const FULL_NODE_INDEX = (() => {
  const m = {};
  GLOBE_MODEL.nodes.forEach(n => { m[n.id] = n; });
  return m;
})();

const CAM_MIN = 6.5;
const CAM_MAX = 24;

// Vecteurs réutilisables — pas d'allocation dans useFrame
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();

// ── Utilitaire arc géodésique ─────────────────────────────────────
function buildArc(ax, ay, az, bx, by, bz, lift = 0.15, segments = 18) {
  _v1.set(ax, ay, az);
  _v2.set(bx, by, bz);
  const r = _v1.length() + lift;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    _v3.lerpVectors(_v1, _v2, i / segments).setLength(r);
    pts.push(_v3.clone());
  }
  return pts;
}

// ── Globe opaque — segments réduits ──────────────────────────────
function GlobeBody({ dark }) {
  return (
    <mesh raycast={() => null}>
      <sphereGeometry args={[5.0, 48, 48]} />
      <meshStandardMaterial
        color={dark ? "#0a0e18" : "#c8c0b4"}
        roughness={dark ? 0.88 : 0.82}
        metalness={dark ? 0.04 : 0.02}
      />
    </mesh>
  );
}

// ── Atmosphère — halo fin aérien visible sur toute la surface ─────
function GlobeAtmosphere({ dark }) {
  return (
    <>
      {/* Halo externe — bleu-indigo en dark, ciel doux en light */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[5.22, 32, 32]} />
        <meshBasicMaterial
          color={dark ? "#1e2d50" : "#b8d0e4"}
          transparent opacity={dark ? 0.09 : 0.13}
          depthWrite={false}
        />
      </mesh>
      {/* Halo interne — plus chaud */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[5.10, 32, 32]} />
        <meshBasicMaterial
          color={dark ? "#0e1830" : "#d8e8f4"}
          transparent opacity={dark ? 0.06 : 0.08}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// ── Auto-rotation ─────────────────────────────────────────────────
function AutoRotate({ enabled }) {
  const { camera } = useThree();
  const sph = useRef(new THREE.Spherical());
  useEffect(() => { sph.current.setFromVector3(camera.position); }, [camera]);
  useFrame(() => {
    if (!enabled) return;
    sph.current.theta += 0.0016;
    camera.position.setFromSpherical(sph.current);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ── Animation caméra ─────────────────────────────────────────────
function CameraAnimator({ target }) {
  const { camera } = useThree();
  const animating  = useRef(false);
  const progress   = useRef(0);
  const startPos   = useRef(new THREE.Vector3());
  const endPos     = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!target) return;
    const dir  = _v1.set(target.x ?? 0, target.y ?? 0, target.z ?? 0).normalize();
    const dist = Math.max(CAM_MIN + 1.5, camera.position.length());
    startPos.current.copy(camera.position);
    endPos.current.copy(dir).multiplyScalar(dist);
    progress.current = 0;
    animating.current = true;
  }, [target?.id]);

  useFrame(() => {
    if (!animating.current) return;
    progress.current = Math.min(1, progress.current + 0.028);
    const t = 1 - Math.pow(1 - progress.current, 3);
    camera.position.lerpVectors(startPos.current, endPos.current, t);
    camera.lookAt(0, 0, 0);
    if (progress.current >= 1) animating.current = false;
  });
  return null;
}

// ── Capteur de zoom ───────────────────────────────────────────────
function ZoomSensor({ onChange }) {
  const { camera } = useThree();
  const last = useRef(-1);
  useFrame(() => {
    const d = camera.position.length();
    const f = Math.max(0, Math.min(1, (d - CAM_MIN) / (CAM_MAX - CAM_MIN)));
    const r = Math.round(f * 100) / 100;
    if (r !== last.current) { last.current = r; onChange(r); }
  });
  return null;
}

// ── Long-press mobile → zoom ─────────────────────────────────────
// Implémenté proprement via pointer events — compatible avec OrbitControls
function MobileLongPress({ onLongPress }) {
  const { gl } = useThree();
  const timer  = useRef(null);
  const moved  = useRef(false);

  useEffect(() => {
    const el = gl.domElement;

    function onPointerDown(e) {
      if (e.pointerType !== "touch") return;
      if (e.isPrimary === false) return; // ignorer multi-touch
      moved.current = false;
      timer.current = setTimeout(() => {
        if (!moved.current) onLongPress();
      }, 500);
    }
    function onPointerMove(e) {
      if (e.pointerType !== "touch") return;
      moved.current = true;
      clearTimeout(timer.current);
    }
    function onPointerUp(e) {
      if (e.pointerType !== "touch") return;
      clearTimeout(timer.current);
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup",   onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup",   onPointerUp);
      clearTimeout(timer.current);
    };
  }, [gl, onLongPress]);
  return null;
}

// ── Liens de base ────────────────────────────────────────────────
function LinkLayer({ visibleLinks, nodeIndex, distanceFactor, selectedWork, hoveredWork }) {
  return (
    <>
      {visibleLinks.map(link => {
        const wa = nodeIndex[link.source];
        const wb = nodeIndex[link.target];
        if (!wa || !wb) return null;
        return (
          <WorkLink
            key={`${link.source}--${link.target}`}
            workA={wa} workB={wb}
            distanceFactor={distanceFactor}
            isHighlighted={
              selectedWork?.id === wa.id || selectedWork?.id === wb.id ||
              hoveredWork?.id  === wa.id || hoveredWork?.id  === wb.id
            }
            strength={link.strength} isBridge={link.bridge}
          />
        );
      })}
    </>
  );
}

// ── Liens "Explorer autour" — géométries dans useMemo ─────────────
function NearbyLinks({ selectedWork, nearbyWorks }) {
  const linesRef = useRef([]);

  const geos = useMemo(() => {
    if (!selectedWork || !nearbyWorks?.length) return [];
    const src = FULL_NODE_INDEX[selectedWork.id] || selectedWork;
    return nearbyWorks.map((w, i) => {
      const nd  = FULL_NODE_INDEX[w.id] || w;
      const pts = buildArc(
        src.x??0, src.y??0, src.z??0,
        nd.x??0,  nd.y??0,  nd.z??0,
        0.18, 16
      );
      return new THREE.BufferGeometry().setFromPoints(pts);
    });
  }, [selectedWork?.id, nearbyWorks?.length]);

  // Dispose géométries périmées
  useEffect(() => () => { geos.forEach(g => g.dispose()); }, [geos]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    linesRef.current.forEach((line, i) => {
      if (line?.material) {
        line.material.opacity = 0.12 + Math.sin(t * 1.1 + i * 0.4) * 0.08;
      }
    });
  });

  if (!geos.length) return null;

  return (
    <>
      {geos.map((geo, i) => (
        <line key={i} geometry={geo} ref={el => { linesRef.current[i] = el; }}>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.14} depthWrite={false} />
        </line>
      ))}
    </>
  );
}

// ── Trajectoire artiste ───────────────────────────────────────────
function ArtistTrajectory({ trajectoryWorks, selectedWork }) {
  const lineRef = useRef();

  const { geometry, color, dots } = useMemo(() => {
    if (!trajectoryWorks?.length || trajectoryWorks.length < 2) {
      return { geometry: null, color: "#ffffff", dots: [] };
    }
    const works = trajectoryWorks
      .map(w => FULL_NODE_INDEX[w.id] || w)
      .filter(w => w.x != null);
    if (works.length < 2) return { geometry: null, color: "#ffffff", dots: [] };

    const BIOME_COL = {
      dense:"#FF6B2F", atmospheric:"#4ABFFF", structural:"#E8C97A",
      narrative:"#FF9A4D", hybrid:"#C07AE8",
    };
    const col = BIOME_COL[works[0]?.biome] || "#e8dfc8";

    const allPts = [];
    for (let i = 0; i < works.length - 1; i++) {
      const arc = buildArc(
        works[i].x, works[i].y, works[i].z,
        works[i+1].x, works[i+1].y, works[i+1].z,
        0.22, 14
      );
      if (i > 0) arc.shift();
      allPts.push(...arc);
    }
    const geo = new THREE.BufferGeometry().setFromPoints(allPts);
    return { geometry: geo, color: col, dots: works };
  }, [trajectoryWorks?.length]);

  useEffect(() => () => { geometry?.dispose(); }, [geometry]);

  useFrame(({ clock }) => {
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = 0.25 + Math.sin(clock.elapsedTime * 0.5) * 0.07;
    }
  });

  if (!geometry) return null;

  return (
    <group>
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} />
      </line>
      {dots.map((w, i) => {
        const r  = 0.018 + ((w.score||5)-5)/5 * 0.016;
        const sel = selectedWork?.id === w.id;
        return (
          <mesh key={w.id} position={[w.x, w.y, w.z]}>
            <sphereGeometry args={[sel ? r*1.8 : r, 8, 8]} />
            <meshBasicMaterial color={sel ? "#ffffff" : color} transparent opacity={sel ? 0.9 : 0.55} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Scène interne ─────────────────────────────────────────────────
function GlobeInner({
  works, activeFilter,
  selectedWork, hoveredWork,
  onSelectWork, onHoverWork,
  dark, autoRotating, onInteract,
  nearbyWorks, trajectoryWorks,
}) {
  const [df, setDf] = useState(0.5);
  const controlsRef = useRef();
  const { camera }  = useThree();

  const { links, clusters, territories } = GLOBE_MODEL;
  const nodeIndex = FULL_NODE_INDEX;

  const visibleNodes = useMemo(() => {
    if (!Array.isArray(works) || !works.length) return GLOBE_MODEL.nodes;
    return works.map(w => FULL_NODE_INDEX[w.id] || w);
  }, [works]);

  const visibleTerritories = useMemo(() =>
    activeFilter === "all" ? territories : territories.filter(t => t.biome === activeFilter),
  [territories, activeFilter]);

  const visibleClusters = useMemo(() =>
    activeFilter === "all" ? clusters : clusters.filter(c => c.biome === activeFilter),
  [clusters, activeFilter]);

  // Liens — limités selon zoom, max 400 rendus à la fois
  const visibleLinks = useMemo(() => {
    let filtered;
    if (df > 0.75) filtered = links.filter(l => l.bridge);
    else if (df > 0.45) filtered = links.filter(l => l.strong || l.bridge);
    else filtered = links;
    return filtered.slice(0, 400); // cap dur
  }, [links, df]);

  // Long press mobile → zoom doux
  const handleLongPress = () => {
    const dir  = camera.position.clone().normalize();
    const cur  = camera.position.length();
    const next = Math.max(CAM_MIN, cur - 2.5);
    const start = camera.position.clone();
    const end   = dir.multiplyScalar(next);
    let p = 0;
    const animate = () => {
      p = Math.min(1, p + 0.04);
      camera.position.lerpVectors(start, end, 1 - Math.pow(1-p, 3));
      camera.lookAt(0, 0, 0);
      if (p < 1) requestAnimationFrame(animate);
    };
    animate();
  };

  return (
    <>
      <ZoomSensor onChange={setDf} />
      <AutoRotate enabled={autoRotating} />
      <CameraAnimator target={selectedWork} />
      <MobileLongPress onLongPress={handleLongPress} />
      <color attach="background" args={[dark ? "#050403" : "#ede6dc"]} />

      <ambientLight intensity={dark ? 0.45 : 1.3} />
      {/* Lumière principale — chaleureuse, de 3/4 */}
      <directionalLight
        position={[10, 8, 6]}
        intensity={dark ? 1.4 : 1.9}
        color={dark ? "#e8d8c0" : "#ffffff"}
      />
      {/* Contre-jour — bleu-ardoise en dark, bleu ciel en light */}
      <directionalLight
        position={[-8, -6, -4]}
        intensity={dark ? 0.28 : 0.38}
        color={dark ? "#2a3a5e" : "#b8ccdd"}
      />
      {/* Rim light — contour violet-bleu discret en dark, absent en light */}
      {dark && (
        <pointLight
          position={[0, -8, -10]}
          intensity={0.55}
          color="#1a1a3a"
          distance={28}
        />
      )}
      {/* Fill light doux */}
      <pointLight
        position={[0, 12, 8]}
        intensity={dark ? 0.30 : 0.45}
        color={dark ? "#fff4e8" : "#ffffff"}
      />

      <Suspense fallback={null}>
        <GlobeBody dark={dark} />
        <GlobeAtmosphere dark={dark} />

        {/* Territoires — seulement 15 max pour éviter la surcharge */}
        {visibleTerritories.slice(0, 15).map(t => (
          <TerritoryField key={t.id} territory={t} distanceFactor={df} dark={dark} />
        ))}

        {visibleClusters.slice(0, 15).map(c => (
          <ClusterCloud key={c.id} cluster={c} distanceFactor={df} />
        ))}

        <LinkLayer
          visibleLinks={visibleLinks}
          nodeIndex={nodeIndex}
          distanceFactor={df}
          selectedWork={selectedWork}
          hoveredWork={hoveredWork}
        />

        <NearbyLinks selectedWork={selectedWork} nearbyWorks={nearbyWorks} />
        <ArtistTrajectory trajectoryWorks={trajectoryWorks} selectedWork={selectedWork} />

        {visibleNodes.map(node => (
          <WorkPoint
            key={node.id}
            work={node}
            selected={selectedWork?.id === node.id}
            hovered={hoveredWork?.id   === node.id}
            distanceFactor={df}
            dark={dark}
            onHover={onHoverWork}
            onSelect={onSelectWork}
          />
        ))}
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.12}      // plus de résistance = moins de dérive
        rotateSpeed={0.50}
        zoomSpeed={0.60}           // zoom plus lent = plus de contrôle
        minDistance={CAM_MIN}
        maxDistance={CAM_MAX}
        onStart={onInteract}
        touches={{
          ONE: THREE.TOUCH.ROTATE,  // 1 doigt = rotation uniquement
          TWO: THREE.TOUCH.DOLLY,   // 2 doigts = zoom uniquement, PAS de rotation
        }}
      />
    </>
  );
}

// ── Export ────────────────────────────────────────────────────────
export default function GlobeScene({
  works, selectedWork, hoveredWork,
  onSelectWork, onHoverWork,
  activeFilter = "all", dark = true,
  nearbyWorks = [], trajectoryWorks = [],
  mobile = false,
}) {
  const [autoRotating, setAutoRotating] = useState(true);

  return (
    <Canvas
      camera={{ position: [0, 0, mobile ? 18 : 14], fov: 44 }}
      style={{ width: "100%", height: mobile ? "calc(100% - 64px)" : "100%", touchAction: "none" }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      }}
      dpr={[1, 1.5]}
      frameloop="always"
      onPointerMissed={() => onHoverWork?.(null)}
    >
      <GlobeInner
        works={works}
        activeFilter={activeFilter}
        selectedWork={selectedWork}
        hoveredWork={hoveredWork}
        onSelectWork={onSelectWork}
        onHoverWork={onHoverWork}
        dark={dark}
        autoRotating={autoRotating}
        onInteract={() => setAutoRotating(false)}
        nearbyWorks={nearbyWorks}
        trajectoryWorks={trajectoryWorks}
      />
    </Canvas>
  );
}
