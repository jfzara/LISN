"use client";
import { useEffect, useRef, useState } from "react";

/**
 * ComparePanel — comparer deux œuvres structuralement
 * Affiche : distance sur le globe, différences dimensionnelles, verdict textuel
 */

const BIOME_COLOR = {
  dense: "#8c8c8c", atmospheric: "#8c8c8c", structural: "#8c8c8c",
  narrative: "#8c8c8c", hybrid: "#8c8c8c",
};
// Durée d'affichage du résultat avant fermeture automatique (ms).
// Le survol du panneau annule la fermeture.
const AUTO_CLOSE_MS = 7000;

const BIOME_LABEL = {
  fr: { dense:"Dense", atmospheric:"Atmosphérique", structural:"Structurel", narrative:"Narratif", hybrid:"Hybride" },
  en: { dense:"Dense", atmospheric:"Atmospheric",   structural:"Structural", narrative:"Narrative", hybrid:"Hybrid"  },
};
const COMPARE_UI = {
  fr: { title:"Pesée", distLabel:"Distance structurale",
        instruction1:"Clique deux œuvres sur le globe pour les comparer.",
        instruction2:"Clique une deuxième œuvre pour comparer.",
        levels:{ veryClose:"Très proches", close:"Proches", far:"Éloignées", veryFar:"Très éloignées", opposite:"Mondes opposés" },
        biomesDiff: (a,b) => `Zones distinctes — ${a} et ${b}` },
  en: { title:"Structural comparison", distLabel:"Structural distance",
        instruction1:"Click two works on the globe to compare.",
        instruction2:"Click a second work to compare.",
        levels:{ veryClose:"Very close", close:"Close", far:"Distant", veryFar:"Very distant", opposite:"Opposite worlds" },
        biomesDiff: (a,b) => `Different zones — ${a} and ${b}` },
};

// Distance structurale approximative entre deux œuvres du seed
export function computeDistance(a, b) {
  if (!a || !b) return null;
  const dphi   = Math.abs((a.phi || 0) - (b.phi || 0));
  const dtheta = Math.abs((a.theta || 0) - (b.theta || 0));
  const ang    = Math.sqrt(dphi * dphi + dtheta * dtheta);
  const dscore = Math.abs((a.score || 0) - (b.score || 0)) / 5;
  const dbiome = a.biome !== b.biome ? 0.3 : 0;
  return Math.min(1, 0.5 * ang + 0.3 * dscore + 0.2 * dbiome);
}

export function distanceLabel(d, lang = "fr") {
  const L = (COMPARE_UI[lang] || COMPARE_UI.fr).levels;
  if (d === null) return "—";
  if (d < 0.10) return L.veryClose;
  if (d < 0.22) return L.close;
  if (d < 0.40) return L.far;
  if (d < 0.60) return L.veryFar;
  return L.opposite;
}

function scoreVerdict(a, b, lang = "fr") {
  if (!a || !b) return null;
  const diff = (a.score || 0) - (b.score || 0);
  const nameA = a.title, nameB = b.title;
  const higher = diff > 0 ? nameA : nameB;
  const lower  = diff > 0 ? nameB : nameA;
  const gap    = Math.abs(diff).toFixed(1);
  if (lang === "en") {
    if (Math.abs(diff) < 0.3) return `${nameA} and ${nameB} are structurally equivalent.`;
    if (Math.abs(diff) < 1.0) return `${higher} slightly outranks ${lower} (+${gap}).`;
    if (Math.abs(diff) < 2.5) return `${higher} is structurally stronger than ${lower} (+${gap}).`;
    return `${higher} belongs to a different order of magnitude than ${lower} (+${gap}).`;
  }
  if (Math.abs(diff) < 0.3) return `${nameA} et ${nameB} sont structurellement équivalentes.`;
  if (Math.abs(diff) < 1.0) return `${higher} dépasse légèrement ${lower} (+${gap}).`;
  if (Math.abs(diff) < 2.5) return `${higher} est structurellement supérieure à ${lower} (+${gap}).`;
  return `${higher} appartient à un autre ordre de grandeur que ${lower} (+${gap}).`;
}

// ── Suggestions d'adversaire ──────────────────────────────────────
// Elles puisent dans toutes les œuvres, filtres ignorés : un duel
// intéressant oppose souvent ce que les filtres séparent.
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
function pickContrast(a, all) {
  const far = all.filter(w => w.id !== a.id && Math.abs((w.score || 0) - (a.score || 0)) >= 4);
  if (far.length) return rand(far);
  const sorted = all.filter(w => w.id !== a.id)
    .sort((x, y) => Math.abs((y.score || 0) - (a.score || 0)) - Math.abs((x.score || 0) - (a.score || 0)));
  return rand(sorted.slice(0, 40));
}
function pickNeighbour(a, all) {
  const near = all.filter(w => w.id !== a.id && w.biome === a.biome && w.artist !== a.artist
    && Math.abs((w.score || 0) - (a.score || 0)) <= 0.5);
  return near.length ? rand(near) : pickContrast(a, all);
}
function pickDuel(all) {
  const high = all.filter(w => (w.score || 0) >= 8.5), low = all.filter(w => (w.score || 0) <= 4.5);
  return [rand(high.length ? high : all), rand(low.length ? low : all)];
}

// ── Un plateau de la balance ──────────────────────────────────────
function Plate({ work, label, ink, paper, onClear, waiting, lang, BL, tag }) {
  const biome = work?.biome || work?.regime;
  return (
    <div style={{ width:"100%", minHeight:104, padding:"11px 12px", position:"relative",
      background: work ? ink : "transparent", color: work ? paper : ink,
      border: work ? `2px solid ${ink}` : `2px dotted ${ink}`, transition:"background 260ms ease" }}>
      <div style={{ fontSize:11, opacity:0.6, marginBottom:5 }}>{label}</div>
      {work && onClear && (
        <button onClick={onClear} aria-label={lang === "fr" ? "Retirer" : "Remove"} style={{
          position:"absolute", top:6, right:8, background:"none", border:"none", cursor:"pointer",
          color: paper, opacity:0.7, fontSize:14, padding:0, lineHeight:1 }}>×</button>
      )}
      {work ? (
        <div key={work.id} style={{ animation:"cmpDrop 380ms cubic-bezier(.2,.8,.2,1) both" }}>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:"-0.02em", lineHeight:1.12,
            overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {work.title}
          </div>
          <div style={{ fontSize:12, opacity:0.7, marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {work.artist}
          </div>
          <div style={{ fontSize:11, opacity:0.6, marginTop:8 }}>
            {BL[biome] || biome || "—"} · {Number(work.score || 0).toFixed(1)}
          </div>
        </div>
      ) : (
        <div style={{ fontSize:13, opacity: waiting ? 0.9 : 0.4, display:"flex", alignItems:"center", gap:8, marginTop:6 }}>
          <span style={{ width:8, height:8, background:ink, display:"inline-block",
            animation: waiting ? "cmpWait 1.4s ease-in-out infinite" : "none" }} />
          {lang === "fr" ? (waiting ? "Pose une œuvre" : "Ensuite") : (waiting ? "Place a work" : "Next")}
        </div>
      )}
      {tag && (
        <div key={tag} style={{ position:"absolute", left:-1, bottom:-22, fontSize:11, fontWeight:700, color:ink,
          animation:"cmpFade 350ms ease both" }}>{tag}</div>
      )}
    </div>
  );
}

export default function ComparePanel({
  workA, workB, onClearA, onClearB, onClose, onSetA, onSetB, allWorks = [],
  dark, T, lang = "fr",
}) {
  const C  = COMPARE_UI[lang] || COMPARE_UI.fr;
  const BL = BIOME_LABEL[lang] || BIOME_LABEL.fr;
  const fr = lang === "fr";

  // Le panneau est d'une autre matière que le globe : papier clair sur globe noir, et l'inverse
  const paper = dark ? "#ffffff" : "#000000";
  const ink   = dark ? "#000000" : "#ffffff";
  const soft  = dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.62)";
  const line  = dark ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.24)";

  const dist    = computeDistance(workA, workB);
  const label   = distanceLabel(dist, lang);
  const verdict = scoreVerdict(workA, workB, lang);
  const complete = !!(workA && workB);
  const pairKey  = complete ? `${workA.id}-${workB.id}` : "";
  const gap = complete ? (workA.score || 0) - (workB.score || 0) : 0;

  // ── La balance : un ressort amorti, pour que le fléau oscille puis se pose ──
  const MAX = 30;                                   // course d'un plateau, en px
  const target = !workA && !workB ? 0
    : workA && !workB ? MAX                         // une seule œuvre : son plateau descend
    : !workA && workB ? -MAX
    : Math.sign(gap) * MAX * Math.pow(Math.min(1, Math.abs(gap) / 4), 0.7);
  const beamRef = useRef(null), aRef = useRef(null), bRef = useRef(null), rowRef = useRef(null);
  const sim = useRef({ x: 0, v: 0, raf: 0 });
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    setSettled(false);
    const st = sim.current;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const apply = () => {
      const span = (rowRef.current?.offsetWidth || 400) * 0.56;
      const deg  = Math.atan2(2 * st.x, span) * 180 / Math.PI;
      if (beamRef.current) beamRef.current.style.transform = `rotate(${-deg}deg)`;
      if (aRef.current) aRef.current.style.transform = `translateY(${st.x}px)`;
      if (bRef.current) bRef.current.style.transform = `translateY(${-st.x}px)`;
    };
    if (reduce) { st.x = target; st.v = 0; apply(); setSettled(true); return; }
    let last = performance.now();
    const K = 17, D = 4.6;                           // ressort lent et rond : le fléau prend son temps, une oscillation et demie
    const step = now => {
      // Pas fixes : le mouvement dure le même temps réel sur une machine lente
      let left = Math.min(0.25, (now - last) / 1000); last = now;
      while (left > 0) {
        const dt = Math.min(1 / 120, left); left -= dt;
        st.v += (-K * (st.x - target) - D * st.v) * dt;
        st.x += st.v * dt;
      }
      apply();
      if (Math.abs(st.x - target) < 0.15 && Math.abs(st.v) < 0.6) { st.x = target; st.v = 0; apply(); setSettled(true); return; }
      st.raf = requestAnimationFrame(step);
    };
    st.raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(st.raf);
  }, [target, pairKey]);

  // ── Fermeture automatique : démarre une fois la balance posée, se suspend au survol ──
  const [held, setHeld] = useState(false);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (!complete || !settled || held) return;
    const t = setTimeout(() => onClose?.(), AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [pairKey, complete, settled, held, bump]);

  const heavier = !complete || !settled ? null : Math.abs(gap) < 0.05 ? "tie" : gap > 0 ? "A" : "B";
  const weighTag = fr ? `pèse plus · +${Math.abs(gap).toFixed(1)}` : `heavier · +${Math.abs(gap).toFixed(1)}`;
  const act = { background:`${ink}14`, border:"none", color:ink, cursor:"pointer",
    fontSize:12, fontWeight:600, padding:"6px 11px", fontFamily:"var(--font-ui)" };

  return (
    <div onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
      onTouchStart={() => setBump(n => n + 1)}
      style={{
        position:"fixed", bottom:68, left:"50%", zIndex:30,
        width:"min(580px, calc(100vw - 24px))", padding:"14px 18px 16px",
        background:paper, color:ink, fontFamily:"var(--font-ui)",
        boxShadow:"0 40px 80px -12px rgba(0,0,0,0.55), 0 10px 22px rgba(0,0,0,0.28)",
        animation:"cmpPanel 520ms cubic-bezier(.16,1,.3,1) both",
      }}>
      <style>{`
        @keyframes cmpPanel { from { opacity:0; transform:translate(-50%, 44px) scale(.96) } to { opacity:1; transform:translate(-50%, 0) scale(1) } }
        @keyframes cmpDrop  { from { opacity:0; transform:translateY(-14px) } to { opacity:1; transform:none } }
        @keyframes cmpFade  { from { opacity:0 } to { opacity:1 } }
        @keyframes cmpRise  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        @keyframes cmpWait  { 0%,100% { opacity:1 } 50% { opacity:0.15 } }
        @keyframes cmpClock { from { transform:scaleX(1) } to { transform:scaleX(0) } }
      `}</style>

      {/* Temps restant avant fermeture */}
      {complete && settled && !held && (
        <div key={`clock-${pairKey}-${bump}`} style={{ position:"absolute", left:0, right:0, top:0, height:3, background:ink,
          transformOrigin:"left", animation:`cmpClock ${AUTO_CLOSE_MS}ms linear both` }} />
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:13, fontWeight:700, letterSpacing:"-0.01em" }}>{fr ? "Pesée" : "Weigh-in"}</span>
        <div style={{ display:"flex", gap:6 }}>
          {complete && (
            <button style={act} onClick={() => { const [a, b] = pickDuel(allWorks); onSetA?.(a); onSetB?.(b); }}>
              {fr ? "Autre duel" : "Another duel"}
            </button>
          )}
          <button style={{ ...act, borderColor:line }} onClick={onClose}
            aria-label={fr ? "Quitter la comparaison" : "Leave comparison"}>
            {fr ? "Fermer" : "Close"}
          </button>
        </div>
      </div>

      {/* La balance */}
      <div ref={rowRef} style={{ position:"relative", height:204, margin:"0 2px" }}>
        {/* Fléau */}
        <div ref={beamRef} style={{ position:"absolute", left:"22%", right:"22%", top:28, height:3, background:ink,
          transformOrigin:"50% 50%", willChange:"transform" }} />
        {/* Pivot */}
        <div style={{ position:"absolute", left:"50%", top:28, transform:"translateX(-50%)",
          width:0, height:0, borderLeft:"9px solid transparent", borderRight:"9px solid transparent",
          borderBottom:`16px solid ${ink}` }} />
        <div style={{ position:"absolute", left:"50%", top:44, bottom:26, width:3, marginLeft:-1.5, background:ink }} />
        <div style={{ position:"absolute", left:"45%", right:"45%", bottom:23, height:3, background:ink }} />
        {/* Plateaux */}
        {[["A", workA, aRef, onClearA, !workA, "0%"], ["B", workB, bRef, onClearB, !!workA && !workB, "56%"]].map(
          ([lab, w, ref, clear, waiting, left]) => (
          <div key={lab} ref={ref} style={{ position:"absolute", left, width:"44%", top:28, willChange:"transform" }}>
            <div style={{ width:2, height:22, background:ink, margin:"0 auto" }} />
            <Plate work={w} label={lab} ink={ink} paper={paper} onClear={clear} waiting={waiting} lang={lang} BL={BL}
              tag={heavier === lab ? weighTag : null} />
          </div>
        ))}
      </div>

      {/* Résultat — après que la balance s'est posée */}
      {complete && settled && (
        <div key={`res-${pairKey}`} style={{ marginTop:6, animation:"cmpRise 420ms cubic-bezier(.2,.7,.2,1) both" }}>
          <div style={{ fontSize:16, fontWeight:600, lineHeight:1.35, letterSpacing:"-0.01em" }}>
            {heavier === "tie" ? (fr ? "Égalité parfaite." : "A perfect tie.") : verdict}
          </div>
          <div style={{ marginTop:5, fontSize:12, color:soft }}>
            {C.distLabel} : {label.toLowerCase()}
            {workA.biome !== workB.biome ? ` · ${BL[workA.biome] || workA.biome} / ${BL[workB.biome] || workB.biome}` : ""}
          </div>
        </div>
      )}

      {/* Tant que la pesée n'est pas complète : une proposition, pas une consigne */}
      {!complete && (
        <div style={{ marginTop:4, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", fontSize:13, color:soft }}>
          {!workA && !workB && (<>
            <span>{fr ? "Clique une œuvre sur le globe, ou" : "Click a work on the globe, or"}</span>
            <button style={act} onClick={() => { const [a, b] = pickDuel(allWorks); onSetA?.(a); onSetB?.(b); }}>
              {fr ? "Duel au hasard" : "Random duel"}
            </button>
          </>)}
          {workA && !workB && (<>
            <span>{fr ? "Contre qui ?" : "Against what?"}</span>
            <button style={act} onClick={() => onSetB?.(pickContrast(workA, allWorks))}>{fr ? "Un contraste" : "A contrast"}</button>
            <button style={act} onClick={() => onSetB?.(pickNeighbour(workA, allWorks))}>{fr ? "Un voisin" : "A neighbour"}</button>
            <span style={{ opacity:0.8 }}>{fr ? "ou clique sur le globe" : "or click the globe"}</span>
          </>)}
        </div>
      )}
    </div>
  );
}
