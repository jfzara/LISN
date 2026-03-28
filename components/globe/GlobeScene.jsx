"use client";

/**
 * GlobeScene v5
 *
 * Corrections Rules of Hooks :
 * - buildGlobeModel() calculé UNE FOIS au module level (pas dans useMemo)
 * - WorkPoint ne fait jamais de return conditionnel entre hooks
 * - Tous les filtres sont des variables JS, pas des changements de structure de hooks
 */

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useRef, useState, useMemo } from "react";
import * as THREE from "three";

import { buildGlobeModel } from "@/lib/lisn/buildGlobeModel";
import { worksSeed }       from "@/data/worksSeed";
import WorkPoint           from "./WorkPoint";
import WorkLink            from "./WorkLink";
import TerritoryField      from "./TerritoryField";
import ClusterCloud        from "./ClusterCloud";

// ── Modèle calculé une seule fois au chargement du module ────────
// Jamais dans un useMemo — évite tout re-trigger lié au cycle React
const GLOBE_MODEL = buildGlobeModel(worksSeed);

const CAM_MIN = 6.5;
const CAM_MAX = 24;

// ── Globe opaque ──────────────────────────────────────────────────
function GlobeBody() {
  return (
    <mesh raycast={() => null}>
      <sphereGeometry args={[5.0, 128, 128]} />
      <meshStandardMaterial color="#0a0806" roughness={0.90} metalness={0.03} />
    </mesh>
  );
}

// ── Atmosphère ────────────────────────────────────────────────────
function GlobeAtmosphere() {
  return (
    <mesh raycast={() => null}>
      <sphereGeometry args={[5.28, 64, 64]} />
      <meshBasicMaterial
        color="#1a3366" transparent opacity={0.038}
        side={THREE.BackSide} depthWrite={false}
      />
    </mesh>
  );
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

// ── Couche de liens ───────────────────────────────────────────────
// Composant stable — reçoit la liste filtrée en prop, pas de hook conditionnel
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
            workA={wa}
            workB={wb}
            distanceFactor={distanceFactor}
            isHighlighted={
              selectedWork?.id === wa.id || selectedWork?.id === wb.id ||
              hoveredWork?.id  === wa.id || hoveredWork?.id  === wb.id
            }
            strength={link.strength}
            isBridge={link.bridge}
          />
        );
      })}
    </>
  );
}

// ── Scène interne ─────────────────────────────────────────────────
function GlobeInner({ activeFilter, selectedWork, hoveredWork, onSelectWork, onHoverWork }) {
  // Tous les hooks en premier, sans exception
  const [df, setDf] = useState(0.5);

  const { nodes, links, clusters, territories } = GLOBE_MODEL;

  // Index stable — GLOBE_MODEL ne change jamais
  const nodeIndex = useMemo(() => {
    const m = {};
    nodes.forEach(n => { m[n.id] = n; });
    return m;
  }, [nodes]);

  // Filtres — simples dérivations JS, pas de changement de structure de hooks
  const visibleNodes = useMemo(() =>
    activeFilter === "all" ? nodes : nodes.filter(n => n.biome === activeFilter),
  [nodes, activeFilter]);

  const visibleTerritories = useMemo(() =>
    activeFilter === "all" ? territories : territories.filter(t => t.biome === activeFilter),
  [territories, activeFilter]);

  const visibleClusters = useMemo(() =>
    activeFilter === "all" ? clusters : clusters.filter(c => c.biome === activeFilter),
  [clusters, activeFilter]);

  // Liens filtrés selon zoom — calcul JS pur, pas de hook
  const visibleLinks = useMemo(() => {
    if (df > 0.75) return links.filter(l => l.bridge);
    if (df > 0.45) return links.filter(l => l.strong || l.bridge);
    return links;
  }, [links, df]);

  return (
    <>
      <ZoomSensor onChange={setDf} />
      <color attach="background" args={["#040302"]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 8, 6]}   intensity={1.3} color="#fff8f0" />
      <directionalLight position={[-8, -6, -4]}  intensity={0.25} color="#3355cc" />
      <pointLight       position={[0, 14, 8]}    intensity={0.4} />

      <Suspense fallback={null}>
        <GlobeBody />

        {visibleTerritories.map(t => (
          <TerritoryField key={t.id} territory={t} distanceFactor={df} />
        ))}

        {visibleClusters.map(c => (
          <ClusterCloud key={c.id} cluster={c} distanceFactor={df} />
        ))}

        <LinkLayer
          visibleLinks={visibleLinks}
          nodeIndex={nodeIndex}
          distanceFactor={df}
          selectedWork={selectedWork}
          hoveredWork={hoveredWork}
        />

        {visibleNodes.map(node => (
          <WorkPoint
            key={node.id}
            work={node}
            selected={selectedWork?.id === node.id}
            hovered={hoveredWork?.id   === node.id}
            distanceFactor={df}
            onHover={onHoverWork}
            onSelect={onSelectWork}
          />
        ))}

        <GlobeAtmosphere />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.60}
        zoomSpeed={0.80}
        minDistance={CAM_MIN}
        maxDistance={CAM_MAX}
      />
    </>
  );
}

// ── Export ────────────────────────────────────────────────────────
export default function GlobeScene({
  selectedWork,
  hoveredWork,
  onSelectWork,
  onHoverWork,
  activeFilter = "all",
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 14], fov: 44 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true }}
      onPointerMissed={() => onHoverWork?.(null)}
    >
      <GlobeInner
        activeFilter={activeFilter}
        selectedWork={selectedWork}
        hoveredWork={hoveredWork}
        onSelectWork={onSelectWork}
        onHoverWork={onHoverWork}
      />
    </Canvas>
  );
}
