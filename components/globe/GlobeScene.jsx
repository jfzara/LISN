"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, PerformanceMonitor } from "@react-three/drei";
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
// Sphère très finement découpée : le contour est un cercle, plus un polygone.
// Le bord prend un soupçon de la couleur ambiante (celle du fond), sur une bande
// étroite : le disque devient un volume sans ombrage ni reflet appuyé.
function GlobeBody({ dark }) {
  const mat = useRef();
  const uniforms = useMemo(() => ({
    uBase: { value: new THREE.Color("#000000") },
    uAmbient: { value: new THREE.Color("#ffffff") },
  }), []);
  useFrame(({ scene }) => {
    uniforms.uBase.value.set(dark ? "#000000" : "#ffffff");
    if (scene.background?.isColor) uniforms.uAmbient.value.copy(scene.background);
  });
  return (
    <mesh raycast={() => null} renderOrder={-10}>
      <sphereGeometry args={[5.0, 192, 192]} />
      <shaderMaterial ref={mat} uniforms={uniforms} toneMapped={false} transparent depthWrite
        vertexShader={`varying float vF; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0);
          vF = dot(normalize(normalMatrix * normal), normalize(-mv.xyz)); gl_Position = projectionMatrix * mv; }`}
        fragmentShader={`uniform vec3 uBase; uniform vec3 uAmbient; varying float vF;
          void main(){ float rim = pow(1.0 - clamp(vF, 0.0, 1.0), 3.5);
            float edge = smoothstep(0.0, max(fwidth(vF) * 1.4, 0.0001), vF);   // bord du disque, lissé au pixel
            gl_FragColor = vec4(mix(uBase, uAmbient, rim * 0.34), edge); }`} />
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
          color={dark ? "#000000" : "#1226f0"}
          transparent opacity={0}
          depthWrite={false}
        />
      </mesh>
      {/* Halo interne — plus chaud */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[5.10, 32, 32]} />
        <meshBasicMaterial
          color={dark ? "#000000" : "#1226f0"}
          transparent opacity={0}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// ── Intro cinématique — zoom depuis loin, variation aléatoire ──────
function CinematicIntro({ onComplete, mobile }) {
  const { camera } = useThree();
  const progress = useRef(0);
  const done     = useRef(false);
  const startSph = useRef(new THREE.Spherical());
  const endSph   = useRef(new THREE.Spherical());

  useEffect(() => {
    // Angle d'approche aléatoire — différent à chaque visite
    const randTheta = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
    const randPhi   = Math.random() * Math.PI * 2;
    const startDist = mobile ? 32 : 28;
    const endDist   = mobile ? 21 : 16.5;   // le globe respire : il ne touche plus les bords

    startSph.current.set(startDist, randTheta, randPhi);
    endSph.current.set(endDist, randTheta + 0.15, randPhi + 0.08);
    camera.position.setFromSpherical(startSph.current);
    camera.lookAt(0, 0, 0);
  }, []);

  useFrame((_, delta) => {
    if (done.current) return;
    // 2,4 s réelles, quel que soit le taux de rafraîchissement
    progress.current = Math.min(1, progress.current + Math.min(delta, 0.25) / 2.4);
    // Ease-out quintic — très fluide
    const t = 1 - Math.pow(1 - progress.current, 5);
    const sph = new THREE.Spherical().copy(startSph.current);
    sph.radius = startSph.current.radius + (endSph.current.radius - startSph.current.radius) * t;
    sph.phi    = startSph.current.phi    + (endSph.current.phi    - startSph.current.phi)    * t;
    sph.theta  = startSph.current.theta  + (endSph.current.theta  - startSph.current.theta)  * t;
    camera.position.setFromSpherical(sph);
    camera.lookAt(0, 0, 0);
    if (progress.current >= 1) {
      done.current = true;
      onComplete?.();
    }
  });
  return null;
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
// La caméra tourne AUTOUR du globe (interpolation sphérique) : elle ne le traverse
// jamais, même pour rejoindre l'autre face. Sur un long trajet elle prend du recul
// à mi-course puis redescend, comme un survol.
function CameraAnimator({ target, paused = false }) {
  const { camera } = useThree();
  const animating  = useRef(false);
  const progress   = useRef(0);
  const a = useRef(new THREE.Vector3()), b = useRef(new THREE.Vector3());
  const d0 = useRef(0), d1 = useRef(0), ang = useRef(0);
  const q0 = useMemo(() => new THREE.Quaternion(), []), q1 = useMemo(() => new THREE.Quaternion(), []);
  const Z = useMemo(() => new THREE.Vector3(0, 0, 1), []);

  useEffect(() => {
    if (!target) return;
    b.current.set(target.x ?? 0, target.y ?? 0, target.z ?? 0).normalize();
    a.current.copy(camera.position).normalize();
    d0.current = camera.position.length();
    d1.current = target.dist ?? Math.max(CAM_MIN + 1.5, d0.current);
    ang.current = a.current.angleTo(b.current);
    progress.current = 0;
    animating.current = true;
  }, [target?.id]);

  useFrame((_, delta) => {
    if (paused) { animating.current = false; return; }
    if (!animating.current) return;
    // durée réelle, indépendante du nombre d'images : de 0,7 s (voisin) à 1,5 s (antipode)
    const dur = 0.7 + 0.8 * (ang.current / Math.PI);
    progress.current = Math.min(1, progress.current + Math.min(delta, 0.05) / dur);
    const p = progress.current;
    const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    q0.setFromUnitVectors(Z, a.current); q1.setFromUnitVectors(Z, b.current);
    q0.slerp(q1, t);
    const lift = Math.sin(Math.PI * t) * 2.6 * (ang.current / Math.PI);
    const dist = Math.min(CAM_MAX, d0.current + (d1.current - d0.current) * t + lift);
    camera.position.copy(Z).applyQuaternion(q0).multiplyScalar(dist);
    camera.lookAt(0, 0, 0);
    if (p >= 1) animating.current = false;
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
function LinkLayer({ visibleLinks, nodeIndex, distanceFactor, selectedWork, hoveredWork, dark }) {
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
            strength={link.strength} isBridge={link.bridge} dark={dark}
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
          <lineBasicMaterial color="#ffffff" transparent opacity={0.1} depthWrite={false} />
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
      dense:"#8c8c8c", atmospheric:"#8c8c8c", structural:"#8c8c8c",
      narrative:"#8c8c8c", hybrid:"#8c8c8c",
    };
    const col = BIOME_COL[works[0]?.biome] || "#ffffff";

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
        <lineBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} />
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

// ── Fond de scène : l'encre ───────────────────────────────────────
// Quand l'œuvre change, le fond prend sa couleur d'un coup, mais l'ancienne couleur
// est encore là : elle se retire en un cercle qui part du point choisi.
// Le fond appartient à l'œuvre, et c'est de elle qu'il se propage.
const INK_VERT = `varying vec2 vN; void main(){ vN = position.xy; gl_Position = vec4(position.xy, 1.0, 1.0); }`;
const INK_FRAG = `uniform vec3 uOld; uniform vec2 uCenter; uniform float uAspect; uniform float uR;
  uniform vec3 uFq; uniform vec3 uPh; uniform float uAmp; varying vec2 vN;
  void main(){
    vec2 p = (vN - uCenter) * vec2(uAspect, 1.0);
    float a = atan(p.y, p.x);
    float wob = sin(a * uFq.x + uPh.x) * 0.55 + sin(a * uFq.y + uPh.y) * 0.3 + sin(a * uFq.z + uPh.z) * 0.15;
    float edge = uR + uAmp * wob * min(uR, 1.0);
    float w = 0.012;
    float alpha = smoothstep(edge - w, edge + w, length(p));
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uOld, alpha);
    #include <colorspace_fragment>
  }`;

function SceneBackground({ color, focus }) {
  const { scene, camera, size } = useThree();
  const target  = useMemo(() => new THREE.Color(color), [color]);
  const shown   = useRef(null);                 // couleur actuellement affichée comme "ancienne"
  const prev    = useRef(null);
  const focusRef = useRef(focus);
  const mesh    = useRef();
  const t0      = useRef(null);
  const V       = useMemo(() => new THREE.Vector3(), []);
  const uniforms = useMemo(() => ({
    uOld: { value: new THREE.Color() }, uCenter: { value: new THREE.Vector2() },
    uAspect: { value: 1 }, uR: { value: 0 },
    uFq: { value: new THREE.Vector3(5, 9, 14) }, uPh: { value: new THREE.Vector3() }, uAmp: { value: 0.05 },
  }), []);
  const dur = useRef(1100);
  focusRef.current = focus;

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!scene.background) scene.background = target.clone(); else scene.background.copy(target);
    if (scene.fog) scene.fog.color.copy(scene.background);
    const far = prev.current && Math.hypot(prev.current.r - target.r, prev.current.g - target.g, prev.current.b - target.b) > 0.12;
    if (prev.current && !reduce && far && t0.current == null) {   // pas de nouvelle encre pendant qu'une autre coule
      uniforms.uOld.value.copy(shown.current || prev.current);
      const f = focusRef.current;
      let cx = 0, cy = 0;
      if (f && Number.isFinite(f.x)) {
        V.set(f.x, f.y, f.z).project(camera);
        cx = Math.max(-1.1, Math.min(1.1, V.x)); cy = Math.max(-1.1, Math.min(1.1, V.y));
      }
      uniforms.uCenter.value.set(cx, cy);
      // Chaque œuvre a sa propre encre : la forme du bord vient de son identifiant,
      // la durée de l'écart entre les deux couleurs (un petit écart passe vite).
      let h = 2166136261; const key = String(f?.id ?? `${color}`);
      for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
      const r = n => ((Math.imul(h ^ (n * 374761393), 668265263) >>> 0) % 1000) / 1000;
      uniforms.uFq.value.set(3 + Math.floor(r(1) * 4), 6 + Math.floor(r(2) * 6), 11 + Math.floor(r(3) * 8));
      uniforms.uPh.value.set(r(4) * 6.283, r(5) * 6.283, r(6) * 6.283);
      uniforms.uAmp.value = 0.03 + r(7) * 0.07;
      dur.current = Math.max(700, Math.min(1500, 600 + Math.hypot(uniforms.uOld.value.r - target.r, uniforms.uOld.value.g - target.g, uniforms.uOld.value.b - target.b) * 900));
      uniforms.uAspect.value = size.width / size.height;
      uniforms.uR.value = 0;
      t0.current = performance.now();
    }
    prev.current = target.clone();
    shown.current = null;
  }, [scene, camera, size, target, uniforms, V]);

  useFrame(() => {
    if (!mesh.current) return;
    if (t0.current == null) { mesh.current.visible = false; return; }
    const k = Math.min(1, (performance.now() - t0.current) / dur.current);
    const e = 1 - Math.pow(1 - k, 3);
    const cx = uniforms.uCenter.value.x, cy = uniforms.uCenter.value.y, A = uniforms.uAspect.value;
    const far = Math.hypot((Math.abs(cx) + 1) * A, Math.abs(cy) + 1);      // jusqu'au coin le plus lointain
    uniforms.uR.value = e * (far + 0.1);
    mesh.current.visible = true;
    if (k >= 1) { t0.current = null; mesh.current.visible = false; }
  });

  return (
    <mesh ref={mesh} renderOrder={-100} frustumCulled={false} raycast={() => null} visible={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial uniforms={uniforms} vertexShader={INK_VERT} fragmentShader={INK_FRAG}
        transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

// ── Arc de comparaison : se trace d'une œuvre à l'autre ───────────
function CompareArc({ a, b, dark }) {
  const SEG = 64;
  const ref = useRef();
  const t0  = useRef(null);
  const geometry = useMemo(() => {
    const angle = new THREE.Vector3(a.x, a.y, a.z).angleTo(new THREE.Vector3(b.x, b.y, b.z));
    const base = buildArc(a.x, a.y, a.z, b.x, b.y, b.z, 0.06, SEG);
    // L'arc se soulève au milieu, d'autant plus que les œuvres sont éloignées
    const pts = base.map((p, i) => p.clone().multiplyScalar(1 + Math.sin((i / SEG) * Math.PI) * angle * 0.09));
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    g.setDrawRange(0, 0);
    return g;
  }, [a, b]);
  useFrame(({ clock }) => {
    if (t0.current === null) t0.current = clock.elapsedTime;
    const p = Math.min(1, (clock.elapsedTime - t0.current - 0.35) / 0.9);   // court délai, puis 0,9 s de tracé
    const eased = p <= 0 ? 0 : 1 - Math.pow(1 - p, 3);
    geometry.setDrawRange(0, Math.round(eased * (SEG + 1)));
  });
  return (
    <line ref={ref} geometry={geometry} raycast={() => null}>
      <lineBasicMaterial color={dark ? "#ffffff" : "#000000"} transparent opacity={0.95} />
    </line>
  );
}

// ── Noms de lieux — quelques repères écrits sur le globe ──────────
// Un texte se lit comme un endroit ; un point, comme une donnée.
function PlaceLabel({ node, dark, onSelect }) {
  const ref = useRef();
  const { camera } = useThree();
  const pos = useMemo(() => new THREE.Vector3(node.x, node.y, node.z), [node]);
  const n   = useMemo(() => pos.clone().normalize(), [pos]);
  const v   = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!ref.current) return;
    // Visible seulement sur la face tournée vers la caméra, fondu au bord
    const facing = n.dot(v.copy(camera.position).normalize());
    const o = Math.max(0, Math.min(1, (facing - 0.35) / 0.3));
    ref.current.style.opacity = (o * 0.85).toFixed(2);
    ref.current.style.pointerEvents = o > 0.5 ? "auto" : "none";
  });
  return (
    <Html position={pos} zIndexRange={[4, 0]} wrapperClass="lisn-blend" style={{ pointerEvents:"none" }}>
      <div ref={ref} onClick={() => onSelect?.(node)} style={{
        transform:"translate(10px, -50%)", whiteSpace:"nowrap", cursor:"pointer",
        fontFamily:"var(--font-ui)", fontSize:12, fontWeight:600, letterSpacing:"0.01em",
        // Blanc inversé par le fond : noir sur blanc, blanc sur noir, et une
        // couleur complémentaire sur un fond teinté. Pas de boîte.
        color: "#ffffff", opacity:0,
        textShadow:"none",
        transition:"opacity 200ms linear", userSelect:"none",
      }}>{node.title}</div>
    </Html>
  );
}

function pickLandmarks(nodes, max = 12, minDist = 2.2) {
  const sorted = [...nodes].filter(n => n.x != null && (n.score || 0) >= 9)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  const out = [], artists = new Set();
  for (const n of sorted) {
    if (out.length >= max) break;
    if (artists.has(n.artist)) continue;
    if (out.some(o => Math.hypot(o.x - n.x, o.y - n.y, o.z - n.z) < minDist)) continue;
    out.push(n); artists.add(n.artist);
  }
  return out;
}

// ── Scène interne ─────────────────────────────────────────────────
function GlobeInner({
  works, activeFilter,
  selectedWork, hoveredWork,
  onSelectWork, onHoverWork,
  dark, autoRotating, onInteract,
  nearbyWorks, trajectoryWorks,
  introPlaying, onIntroComplete, mobile,
  onZoomChange,
  bg, compareA, compareB, trail = null, drawing = false,
}) {
  const [df, setDf] = useState(0.5);
  const controlsRef = useRef();
  const { camera }  = useThree();

  const { links, clusters, territories } = GLOBE_MODEL;
  const nodeIndex = FULL_NODE_INDEX;

  const visibleNodes = useMemo(() => {
    if (!Array.isArray(works)) return GLOBE_MODEL.nodes;   // un filtre sans résultat montre un globe vide, pas tout
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
    // Plus de réseau par défaut : seulement les liens de l'œuvre choisie
    const id = selectedWork?.id;
    if (!id) return [];
    // Jamais de lien vers une œuvre que les filtres ont retirée du globe
    const shown = new Set(visibleNodes.map(n => n.id));
    return links.filter(l => (l.source === id || l.target === id) && shown.has(l.source) && shown.has(l.target)).slice(0, 24);
  }, [links, selectedWork?.id, visibleNodes]);

  const landmarks = useMemo(() => pickLandmarks(visibleNodes), [visibleNodes]);

  // Comparaison : les deux œuvres et le cadrage qui les montre ensemble
  const cmpA = compareA ? (nodeIndex[compareA.id] || null) : null;
  const cmpB = compareB ? (nodeIndex[compareB.id] || null) : null;
  const compareFocus = useMemo(() => {
    if (!cmpA) return null;
    if (!cmpB) return { id:`cmp-${cmpA.id}`, x:cmpA.x, y:cmpA.y, z:cmpA.z };
    const va = new THREE.Vector3(cmpA.x, cmpA.y, cmpA.z), vb = new THREE.Vector3(cmpB.x, cmpB.y, cmpB.z);
    const angle = va.angleTo(vb);
    const mid = va.clone().normalize().add(vb.clone().normalize());
    if (mid.length() < 0.05) mid.copy(va);            // œuvres aux antipodes
    return { id:`cmp-${cmpA.id}-${cmpB.id}`, x:mid.x, y:mid.y, z:mid.z,
             dist: Math.min(CAM_MAX, 12 + angle * 3.2) };   // plus elles sont loin, plus on recule
  }, [cmpA, cmpB]);

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
      <ZoomSensor onChange={df => { setDf(df); onZoomChange?.(df); }} />
      {introPlaying
        ? <CinematicIntro onComplete={onIntroComplete} mobile={mobile} />
        : <AutoRotate enabled={autoRotating} />
      }
      {!introPlaying && <CameraAnimator target={selectedWork || compareFocus} paused={drawing} />}
      <MobileLongPress onLongPress={handleLongPress} />
      <SceneBackground color={bg || (dark ? "#ffffff" : "#000000")} focus={selectedWork} />

      <ambientLight intensity={dark ? 0.32 : 1.1} />
      {/* Lumière principale — chaleureuse, de 3/4 */}
      <directionalLight
        position={[10, 8, 6]}
        intensity={dark ? 2.1 : 2.0}
        color="#ffffff"
      />
      {/* Contre-jour — bleu-ardoise en dark, bleu ciel en light */}
      <directionalLight
        position={[-8, -6, -4]}
        intensity={dark ? 0.28 : 0.38}
        color={dark ? "#3a2a20" : "#d8c8b4"}
      />
      {/* Rim light — contour violet-bleu discret en dark, absent en light */}
      {dark && (
        <pointLight
          position={[0, -8, -10]}
          intensity={0.55}
          color="#2a1e16"
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
          null /* lavis retirés : palette à trois couleurs, bord net */
        ))}

        {/* ClusterCloud retiré : les zones sont portées par les lavis de territoire */}

        <LinkLayer
          visibleLinks={visibleLinks}
          nodeIndex={nodeIndex}
          distanceFactor={df}
          selectedWork={selectedWork}
          hoveredWork={hoveredWork}
          dark={dark}
        />

        <DrawVeil active={drawing} dark={dark} />

        {!introPlaying && !drawing && landmarks.map(n => (
          <PlaceLabel key={`lbl-${n.id}`} node={n} dark={dark} onSelect={onSelectWork} />
        ))}

        <NearbyLinks selectedWork={selectedWork} nearbyWorks={nearbyWorks} />
        <ArtistTrajectory trajectoryWorks={trajectoryWorks} selectedWork={selectedWork} />

        {cmpA && cmpB && <CompareArc key={`${cmpA.id}-${cmpB.id}`} a={cmpA} b={cmpB} dark={dark} />}

        {trail && nodeIndex[trail.to.id] && <TrailArc key={trail.key} a={trail.from ? nodeIndex[trail.from.id] || null : null} b={nodeIndex[trail.to.id]} dark={dark} />}

        {visibleNodes.map(node => (
          <WorkPoint
            key={node.id}
            work={node}
            selected={selectedWork?.id === node.id || cmpA?.id === node.id || cmpB?.id === node.id}
            hovered={hoveredWork?.id   === node.id}
            dim={!!hoveredWork && hoveredWork.id !== node.id}
            distanceFactor={df}
            dark={dark}
            accent={selectedWork?.id === node.id ? bg : null}
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
          ONE: THREE.TOUCH.ROTATE,      // 1 doigt = rotation
          TWO: THREE.TOUCH.DOLLY_PAN,   // 2 doigts = zoom (pan désactivé par enablePan=false)
        }}
      />
    </>
  );
}

// ── Tirage : le globe s'éteint presque et tourne sur lui-même en ralentissant,
//    pour que les titres qui défilent soient seuls à l'écran ──
function DrawVeil({ active, dark }) {
  const mat = useRef();
  const t0 = useRef(null);
  const Y = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#000000") }, uOpacity: { value: 0 } }), []);
  useEffect(() => { uniforms.uColor.value.set(dark ? "#000000" : "#ffffff"); }, [dark, uniforms]);
  useFrame(({ camera, clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    if (mat.current) {
      const u = mat.current.uniforms.uOpacity;
      const goal = active ? 0.88 : 0;
      u.value += (goal - u.value) * Math.min(1, dt * (active ? 14 : 5));
      mat.current.visible = u.value > 0.01;
    }
    if (!active) { t0.current = null; return; }
    if (t0.current === null) t0.current = clock.elapsedTime;
    const t = clock.elapsedTime - t0.current;
    const w = 4.6 * Math.max(0.12, 1 - t / 1.25);          // rad/s, la roue ralentit
    camera.position.applyAxisAngle(Y, w * dt);
    camera.lookAt(0, 0, 0);
  });
  return (
    <mesh raycast={() => null} renderOrder={999}>
      <sphereGeometry args={[5.16, 96, 96]} />
      {/* Le voile s'efface vers le bord du disque : pas d'anneau gris autour du globe */}
      <shaderMaterial ref={mat} transparent depthWrite={false} toneMapped={false}
        uniforms={uniforms}
        vertexShader={`varying float vF; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0);
          vF = dot(normalize(normalMatrix * normal), normalize(-mv.xyz)); gl_Position = projectionMatrix * mv; }`}
        fragmentShader={`uniform vec3 uColor; uniform float uOpacity; varying float vF;
          void main(){ gl_FragColor = vec4(uColor, uOpacity * smoothstep(0.08, 0.36, vF)); }`} />
    </mesh>
  );
}

// ── Surprise : un fil relie l'œuvre quittée à la nouvelle, puis une onde ──
function TrailArc({ a, b, dark }) {
  const SEG = 64;
  const ringRef = useRef();
  const lineMatRef = useRef();
  const t0 = useRef(null);
  const geometry = useMemo(() => {
    const base = a ? buildArc(a.x, a.y, a.z, b.x, b.y, b.z, 0.06, SEG) : [];
    const g = new THREE.BufferGeometry().setFromPoints(base);
    g.setDrawRange(0, 0);
    return g;
  }, [a, b]);
  const ringQ = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), new THREE.Vector3(b.x, b.y, b.z).normalize()), [b]);
  const R = useMemo(() => new THREE.Vector3(b.x, b.y, b.z).length(), [b]);
  useFrame(({ clock }) => {
    if (t0.current === null) t0.current = clock.elapsedTime;
    const t = clock.elapsedTime - t0.current;
    const draw = Math.min(1, t / 0.9);
    geometry.setDrawRange(0, a ? Math.round((1 - Math.pow(1 - draw, 3)) * (SEG + 1)) : 0);
    const fade = Math.max(0, Math.min(1, (t - 3.0) / 1.2));
    if (lineMatRef.current) lineMatRef.current.opacity = 0.9 * (1 - fade);
    if (ringRef.current) {
      // Deux ondes brèves l'une après l'autre, à l'arrivée du fil
      const tt = t - (a ? 0.8 : 0.1);
      const rp = tt < 0 ? 0 : Math.min(1, (tt % 1.1) / 0.9);
      const live = tt >= 0 && tt < 2.2;
      ringRef.current.scale.setScalar(R * (0.012 + 0.06 * (1 - Math.pow(1 - rp, 3))));
      ringRef.current.material.opacity = live ? 0.95 * (1 - rp) : 0;
    }
  });
  const col = dark ? "#ffffff" : "#000000";
  return (
    <group>
      <line geometry={geometry} raycast={() => null}>
        <lineBasicMaterial ref={lineMatRef} color={col} transparent opacity={0.9} />
      </line>
      <mesh ref={ringRef} position={[b.x, b.y, b.z]} quaternion={ringQ} raycast={() => null}>
        <ringGeometry args={[0.9, 1, 64]} />
        <meshBasicMaterial color={col} transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Export ────────────────────────────────────────────────────────
export default function GlobeScene({
  works, selectedWork, hoveredWork,
  onSelectWork, onHoverWork,
  activeFilter = "all", dark = true, bg, compareA = null, compareB = null, trail = null, drawing = false,
  nearbyWorks = [], trajectoryWorks = [],
  mobile = false,
  onIntroComplete,
  onZoomChange,
}) {
  const [autoRotating,    setAutoRotating]    = useState(false); // désactivé pendant l'intro
  const [introPlaying,    setIntroPlaying]    = useState(true);
  // Résolution adaptative : pleine netteté tant que la fluidité tient, un cran de moins sinon
  const [dprMax, setDprMax] = useState(2);

  function handleIntroComplete() {
    setIntroPlaying(false);
    onIntroComplete?.();
  }

  return (
    <Canvas
      camera={{ position: [0, 0, mobile ? 32 : 28], fov: 44 }}
      style={{ width: "100%", height: mobile ? "calc(100% - 64px)" : "100%", touchAction: "none" }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      }}
      dpr={[1, dprMax]}
      frameloop="always"
      onPointerMissed={() => onHoverWork?.(null)}
    >
      <PerformanceMonitor onDecline={() => setDprMax(1.5)} onIncline={() => setDprMax(2)} flipflops={3} />
      <GlobeInner
        works={works}
        activeFilter={activeFilter}
        selectedWork={selectedWork}
        hoveredWork={hoveredWork}
        onSelectWork={onSelectWork}
        onHoverWork={onHoverWork}
        dark={dark}
        bg={bg}
        compareA={compareA} compareB={compareB}
        trail={trail} drawing={drawing}
        autoRotating={autoRotating}
        onInteract={() => { setAutoRotating(false); }}
        nearbyWorks={nearbyWorks}
        trajectoryWorks={trajectoryWorks}
        introPlaying={introPlaying}
        onIntroComplete={handleIntroComplete}
        mobile={mobile}
        onZoomChange={onZoomChange}
      />
    </Canvas>
  );
}
