"use client";

import { useRef, useMemo, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import * as THREE from "three";

// ── Couleurs dark mode — lumineuses, émissives ────────────────────
const BIOME_COLOR_DARK = {
  dense:       new THREE.Color("#8c8c8c"),
  atmospheric: new THREE.Color("#8c8c8c"),
  structural:  new THREE.Color("#8c8c8c"),
  narrative:   new THREE.Color("#8c8c8c"),
  hybrid:      new THREE.Color("#8c8c8c"),
};

// ── Couleurs light mode — pastel clair, légères sur fond ivoire ───
// Problème résolu : les couleurs sombres saturées (#CC4400 etc.)
// sur fond ivoire avec roughness élevé = aspect organique / pustule.
// Solution : couleurs claires désaturées, presque pastel, avec
// une légère émission pour garder l'aspect "bille de lumière".
const BIOME_COLOR_LIGHT = {
  dense:       new THREE.Color("#B85A40"),
  atmospheric: new THREE.Color("#5F86A0"),
  structural:  new THREE.Color("#8A9160"),
  narrative:   new THREE.Color("#C48A45"),
  hybrid:      new THREE.Color("#8C709E"),
};

// Couleur de halo — plus claire que le core pour le soft edge
const BIOME_HALO_DARK = {
  dense:       new THREE.Color("#E08A6C"),
  atmospheric: new THREE.Color("#A8C2D2"),
  structural:  new THREE.Color("#C2C79A"),
  narrative:   new THREE.Color("#E9BC82"),
  hybrid:      new THREE.Color("#C2AACF"),
};

const BIOME_HALO_LIGHT = {
  dense:       new THREE.Color("#F0A080"),
  atmospheric: new THREE.Color("#90D0F0"),
  structural:  new THREE.Color("#E8D898"),
  narrative:   new THREE.Color("#F0B880"),
  hybrid:      new THREE.Color("#C8A0E0"),
};

// lodThreshold — quand un point devient visible selon le zoom
// distanceFactor: 0 = zoom max (serré), 1 = zoom min (lointain)
// Dimension temporelle : les œuvres anciennes émergent au zoom serré
// sauf les capitales (score ≥ 9) qui sont toujours visibles
// lodThreshold — quand un point devient visible selon le zoom
// distanceFactor: 0 = zoom serré (proche), 1 = zoom lointain
//
// Logique temporelle : zoomer = remonter dans le temps
//   Zoom lointain → seules les capitales de toutes les époques
//   Zoom moyen   → + les grandes œuvres récentes et classiques majeurs
//   Zoom serré   → tout émerge, couches anciennes incluses
//
// Exception : les capitales absolues (≥ 9.3) sont toujours visibles —
// ce sont les étoiles fixes de la carte, indépendantes du temps.
function lodThreshold(score, year) {
  const age = year ? 2025 - year : 0;

  // Capitales absolues — permanentes, toujours visibles
  if (score >= 9.3) return 1.00;

  // Score de base
  let base;
  if (score >= 8.8) return 0.90;      // grandes villes — pas de malus, ère classique incluse
  if (score >= 8.0) base = 0.80;
  else if (score >= 7.2) base = 0.58;
  else base = 0.40;

  // Malus temporel — les œuvres > 20 ans exigent un zoom plus serré
  // Plus on zoome, plus les couches anciennes émergent
  if (age > 60)       base *= 0.50;   // pre-1965 : couche profonde, racines
  else if (age > 40)  base *= 0.65;   // pre-1985 : couche intermédiaire
  else if (age > 20)  base *= 0.80;   // pre-2005 : léger recul

  return Math.max(0.25, base);
}

// Encre unique — la couleur de biome n'apparaît qu'au survol / à la sélection
const INK_DARK  = new THREE.Color("#ffffff");
const INK_LIGHT = new THREE.Color("#000000");

// Hiérarchie : peu d'œuvres au premier plan, le reste en texture
function tier(score) {
  if (score >= 9.0) return { scale: 1.0,  opacity: 1.0  };  // repères
  if (score >= 8.3) return { scale: 0.72, opacity: 0.62 };  // villes
  if (score >= 7.5) return { scale: 0.5,  opacity: 0.3  };  // villages
  return               { scale: 0.4,  opacity: 0.16 };      // grain
}

function coreRadius(score) {
  const t = Math.max(0, Math.min(1, (score - 5.0) / 5.0));
  return (0.018 + t * 0.052) * tier(score).scale;
}

function haloRadii(score) {
  const c = coreRadius(score);
  return {
    // Halo 1 — soft edge immédiat (bords flous)
    h1: c * 1.9,
    // Halo 2 — zone d'influence (scores élevés)
    h2: score >= 9.0 ? c * 3.4 : score >= 8.0 ? c * 2.6 : 0,
    // Halo 3 — aura large (capitales seulement)
    h3: score >= 9.5 ? c * 5.5 : 0,
  };
}

function baseEmissive(score, dark) {
  // Light mode : émission légère pour garder l'aspect lumineux
  // sans les couleurs sombres qui donnaient l'effet "viral"
  return 1.0; // aplat : le point est un signe, pas une bille éclairée
}

// ── Disque analytique ────────────────────────────────────────────
// Un carré toujours tourné vers la caméra, dont le bord est calculé au pixel près :
// le point est un cercle parfait à toute taille et sur tout écran, sans facettes.
// inner > 0 en fait un anneau ; feather > 0 le fond en halo.
const DISC_VERT = `varying vec2 vUv; uniform float uSize;
  void main(){ vUv = position.xy;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * uSize;
    gl_Position = projectionMatrix * mv; }`;
const DISC_FRAG = `uniform vec3 uColor; uniform float uAlpha; uniform float uInner; uniform float uFeather;
  varying vec2 vUv;
  void main(){
    float d = length(vUv);
    float aa = max(fwidth(d), 0.0005);
    float outer = 1.0 - smoothstep(1.0 - aa - uFeather, 1.0, d);
    float ring = uInner > 0.0 ? smoothstep(uInner - aa, uInner, d) : 1.0;
    float a = outer * ring * uAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }`;

const Disc = forwardRef(function Disc({ color, size = 1, alpha = 1, inner = 0, feather = 0, ...rest }, ref) {
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color() }, uSize: { value: size }, uAlpha: { value: alpha },
    uInner: { value: inner }, uFeather: { value: feather },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  uniforms.uColor.value.set(color);
  uniforms.uInner.value = inner;
  uniforms.uFeather.value = feather;
  return (
    <mesh ref={ref} raycast={() => null} {...rest}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial uniforms={uniforms} vertexShader={DISC_VERT} fragmentShader={DISC_FRAG}
        transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
});

export default function WorkPoint({
  work, selected, hovered, dim = false, distanceFactor = 0.5,
  dark = true, accent = null, onHover, onSelect,
}) {
  const groupRef = useRef();
  const coreRef  = useRef();
  const halo1Ref = useRef();
  const ringRef  = useRef();
  const fade     = useRef(1);      // apparition en fondu, jamais d'un coup
  const focus    = useRef(1);      // mise au point : les autres reculent quand on regarde un point
  const grow     = useRef(1);      // échelle au survol, amortie

  const isActive = selected || hovered;
  const ink = dark ? INK_DARK : INK_LIGHT;
  // L'œuvre choisie prend la couleur du fond : un trou dans le globe
  const ACCENT = useMemo(() => (selected && accent ? new THREE.Color(accent) : ink), [selected, accent, ink]);
  useCursor(hovered);

  const { pos, color, haloColor, score, cr, hr, lod, ageFactor, tr } = useMemo(() => {
    const biome    = work.biome || work.regime || "structural";
    const sc       = Number(work.score) || 7.0;
    const palette  = dark ? BIOME_COLOR_DARK  : BIOME_COLOR_LIGHT;
    const haloPal  = dark ? BIOME_HALO_DARK   : BIOME_HALO_LIGHT;

    const baseColor  = palette[biome] ?? new THREE.Color("#aaaaaa");
    const baseHalo   = haloPal[biome] ?? new THREE.Color("#cccccc");

    // ── Teinte temporelle ─────────────────────────────────────────
    // pre-1965 : fossile brun-ambre chaud  #c8962a
    // pre-1985 : ambré léger               #c8a96e
    // pre-2005 : légère patine              interpolation faible
    // post-2005 : couleur biome pure
    const year = work.year || 2000;
    const age  = 2025 - year;

    let finalColor = baseColor.clone();
    let finalHalo  = baseHalo.clone();
    let af = 1.0; // ageFactor : 1 = récent pur, 0 = fossile pur

    if (age > 60) {
      // pre-1965 — fossile : brun-doré profond
      af = 0.20;
      finalColor.lerp(new THREE.Color("#b8861a"), 0.72);
      finalHalo.lerp(new THREE.Color("#c8962a"), 0.60);
    } else if (age > 40) {
      // pre-1985 — ambré
      af = 0.45;
      finalColor.lerp(new THREE.Color("#c8a96e"), 0.50);
      finalHalo.lerp(new THREE.Color("#d4b87a"), 0.40);
    } else if (age > 20) {
      // pre-2005 — légère patine
      af = 0.72;
      finalColor.lerp(new THREE.Color("#c8a96e"), 0.18);
      finalHalo.lerp(new THREE.Color("#d4b87a"), 0.12);
    }
    // post-2005 : couleur biome pure, af = 1.0

    return {
      pos:       new THREE.Vector3(work.x ?? 0, work.y ?? 0, work.z ?? 0),
      color:     finalColor,
      haloColor: finalHalo,
      score:     sc,
      cr:        coreRadius(sc),
      hr:        haloRadii(sc),
      lod:       lodThreshold(sc, work.year),
      tr:        tier(sc),
      ageFactor: af,
    };
  }, [work, dark]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const shown = selected || distanceFactor <= lod;        // une œuvre choisie reste toujours visible
    fade.current = THREE.MathUtils.damp(fade.current, shown ? 1 : 0, 9, delta);
    const vis = fade.current > 0.01;
    if (groupRef.current.visible !== vis) groupRef.current.visible = vis;
    if (!vis) return;

    const t  = clock.elapsedTime;
    const ph = work.phi ?? 0;
    const f  = fade.current;

    focus.current = THREE.MathUtils.damp(focus.current, dim && !selected ? 0.22 : 1, 10, delta);
    grow.current = THREE.MathUtils.damp(grow.current, isActive ? Math.max(1.5, 0.045 / cr) : 1, 14, delta);
    if (coreRef.current) {
      const u = coreRef.current.material.uniforms;
      u.uSize.value  = cr * grow.current;
      u.uAlpha.value = f * focus.current * (isActive ? 1 : tr.opacity);
    }
    if (halo1Ref.current) {
      const u = halo1Ref.current.material.uniforms;
      u.uSize.value  = hr.h1 * 1.5 * (1 + Math.sin(t * 0.38 + ph) * 0.08);
      u.uAlpha.value = f * 0.2;
    }
    if (ringRef.current) {
      const u = ringRef.current.material.uniforms;
      u.uSize.value  = hr.h1 * 1.4;
      u.uAlpha.value = f * 0.65;
    }
  });

  const HIT = Math.max(cr * 1.8, 0.05);     // zone de survol généreuse, indépendante du dessin
  return (
    <group ref={groupRef} position={pos}>
      {isActive && <Disc ref={halo1Ref} color={ACCENT} feather={1} alpha={0} />}

      {/* Le point : un disque net, au bord calculé au pixel */}
      <Disc ref={coreRef} color={isActive ? ACCENT : ink} size={cr} alpha={0} />

      {/* Surface de survol invisible */}
      <mesh
        onPointerOver={e => { e.stopPropagation(); onHover?.(work); }}
        onPointerOut={e  => { e.stopPropagation(); onHover?.(null); }}
        onClick={e       => { e.stopPropagation(); onSelect?.(work); }}
      >
        <sphereGeometry args={[HIT, 8, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {selected && <Disc ref={ringRef} color={ACCENT} inner={0.74} alpha={0} />}
    </group>
  );
}
