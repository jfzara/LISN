"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
import GlobeScene    from "@/components/globe/GlobeScene";
import WorkPanel     from "@/components/globe/WorkPanel";
import SearchBar     from "@/components/globe/SearchBar";
import ComparePanel  from "@/components/globe/ComparePanel";
import AnalysisModal from "@/components/globe/AnalysisModal";
import { worksSeed } from "@/data/worksSeed";

// ── Thème ──────────────────────────────────────────────────────────
const THEME = {
  dark: {
    bg: "#040302", text: "#e8dfc8", muted: "rgba(232,223,200,0.45)",
    border: "rgba(232,223,200,0.12)", navBg: "rgba(4,3,2,0.75)",
    cardBg: "rgba(4,3,2,0.93)", pill: "rgba(232,223,200,0.07)",
    track: "rgba(232,223,200,0.08)",
  },
  light: {
    bg: "#e4ddd4", text: "#1a1410", muted: "rgba(26,20,16,0.45)",
    border: "rgba(26,20,16,0.14)", navBg: "rgba(228,221,212,0.82)",
    cardBg: "rgba(228,221,212,0.95)", pill: "rgba(26,20,16,0.06)",
    track: "rgba(26,20,16,0.08)",
  },
};

const BIOME_META = {
  all:         { label: "Tout",    color: null },
  dense:       { label: "Dense",   color: "#FF6B2F" },
  atmospheric: { label: "Atmos",   color: "#4ABFFF" },
  structural:  { label: "Struct",  color: "#E8C97A" },
  narrative:   { label: "Récit",   color: "#FF9A4D" },
  hybrid:      { label: "Hybride", color: "#C07AE8" },
};

// Décennies disponibles dans le seed
const DECADES = [null, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

function applyFilters(works, { biome, scoreMin, scoreMax, decade }) {
  return works.filter(w => {
    if (biome !== "all" && w.biome !== biome) return false;
    const s = w.score || 0;
    if (s < scoreMin || s > scoreMax) return false;
    if (decade) {
      const y = w.year;
      if (!y) return false;
      if (y < decade || y >= decade + 10) return false;
    }
    return true;
  });
}

// ── Slider ──────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 0.5, onChange, T, fmt }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:100 }}>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:9, letterSpacing:"0.13em", textTransform:"uppercase",
          color: T.muted, fontFamily:"'DM Mono',monospace" }}>{label}</span>
        <span style={{ fontSize:9, color: T.muted, fontFamily:"'DM Mono',monospace" }}>
          {fmt ? fmt(value) : value}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width:"100%", height:2, cursor:"pointer", accentColor: T.text, opacity:0.7 }} />
    </div>
  );
}

// ── Onboarding ──────────────────────────────────────────────────────
function Onboarding({ dark, onChoose }) {
  const T  = dark ? THEME.dark : THEME.light;
  const bg = dark
    ? "radial-gradient(ellipse at 50% 60%, rgba(14,10,6,0.94) 0%, rgba(4,3,2,0.99) 100%)"
    : "radial-gradient(ellipse at 50% 60%, rgba(240,233,224,0.94) 0%, rgba(228,221,212,0.99) 100%)";

  const choices = [
    { key:"random",    icon:"◉", label:"Je tourne en rond",        desc:"Emmène-moi quelque part que je ne connais pas" },
    { key:"mountains", icon:"△", label:"Je veux ce qui compte vraiment", desc:"Les œuvres structuralement les plus fortes" },
    { key:"frontier",  icon:"◇", label:"Je veux sortir de ma zone", desc:"Explorer des territoires inconnus" },
    { key:"free",      icon:"○", label:"Je sais déjà ce que je cherche", desc:"Navigation libre sur la carte" },
  ];

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:100,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      background: bg, fontFamily:"'Libre Baskerville', Georgia, serif",
    }}>
      <div style={{ marginBottom:44, textAlign:"center" }}>
        <div style={{ fontSize:52, fontStyle:"italic", letterSpacing:"-0.04em",
          color: T.text, lineHeight:1 }}>lisn</div>
        <div style={{ fontSize:9, letterSpacing:"0.28em", color: T.muted,
          fontFamily:"'DM Mono',monospace", marginTop:8, textTransform:"uppercase" }}>
          atlas des formes musicales
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, width:"min(320px,88vw)" }}>
        {choices.map(c => (
          <button key={c.key} onClick={() => onChoose(c.key)} style={{
            background:"none", border:`1px solid ${T.border}`, borderRadius:1,
            padding:"13px 16px", cursor:"pointer", textAlign:"left",
            display:"flex", alignItems:"center", gap:14, color: T.text,
            transition:"border-color 0.15s, background 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.text; e.currentTarget.style.background=T.pill; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background="none"; }}
          >
            <span style={{ fontSize:16, color: T.muted, width:22, textAlign:"center", flexShrink:0 }}>{c.icon}</span>
            <div>
              <div style={{ fontSize:13 }}>{c.label}</div>
              <div style={{ fontSize:10, color: T.muted, marginTop:2,
                fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em" }}>{c.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ marginTop:44, fontSize:9, letterSpacing:"0.14em", color: T.muted,
        fontFamily:"'DM Mono',monospace", textTransform:"uppercase" }}>
        Not more music. Better music.
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────────────────────────
export default function HomePage() {
  const [dark,            setDark]            = useState(true);
  const [mobile,          setMobile]          = useState(false);
  const [showOnboarding,  setShowOnboarding]  = useState(true);
  const [selectedWork,    setSelectedWork]    = useState(null);
  const [hoveredWork,     setHoveredWork]     = useState(null);
  const [biomeFilter,     setBiomeFilter]     = useState("all");
  const [scoreMin,        setScoreMin]        = useState(2);
  const [scoreMax,        setScoreMax]        = useState(10);
  const [decade,          setDecade]          = useState(null); // null = toutes
  const [panelTab,        setPanelTab]        = useState("fiche");
  const [nearbyWorks,     setNearbyWorks]     = useState([]);
  const [trajectoryWorks, setTrajectoryWorks] = useState([]);

  // Modes spéciaux
  const [voyageMode,    setVoyageMode]    = useState(false);
  const [voyageCurrent, setVoyageCurrent] = useState(null);
  const [compareMode,   setCompareMode]   = useState(false);
  const [compareA,      setCompareA]      = useState(null);
  const [compareB,      setCompareB]      = useState(null);
  const voyageTimer = useRef(null);
  const [analysisWork, setAnalysisWork] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("lisn-theme");
    if (saved === "light") setDark(false);
    if (localStorage.getItem("lisn-onboarding")) setShowOnboarding(false);
    setMobile(window.innerWidth < 768);
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function toggleDark() {
    setDark(v => { localStorage.setItem("lisn-theme", v ? "light" : "dark"); return !v; });
  }

  // ── Onboarding ─────────────────────────────────────────────────
  function handleOnboardingChoice(key) {
    localStorage.setItem("lisn-onboarding", "1");
    setShowOnboarding(false);
    if (key === "random")    landRandom();
    else if (key === "mountains") { setScoreMin(8.5); setScoreMax(10); }
    else if (key === "frontier")  { setScoreMin(2);   setScoreMax(5.5); }
  }

  // ── Atterrissage aléatoire ──────────────────────────────────────
  function landRandom(pool) {
    const src  = pool || filteredWorks;
    const work = src[Math.floor(Math.random() * src.length)];
    if (work) handleSelect(work);
  }

  // ── Voyage ─────────────────────────────────────────────────────
  const startVoyage = useCallback((fromWork) => {
    setVoyageMode(true);
    const start = fromWork || worksSeed[Math.floor(Math.random() * worksSeed.length)];
    setVoyageCurrent(start);
    setSelectedWork(start); setHoveredWork(null);
    setPanelTab("fiche"); setNearbyWorks([]); setTrajectoryWorks([]);
    scheduleNext(start);
  }, []);

  function scheduleNext(cur) {
    clearTimeout(voyageTimer.current);
    voyageTimer.current = setTimeout(() => {
      const nearby = worksSeed
        .filter(w => w.id !== cur.id)
        .map(w => {
          const dphi = Math.abs((w.phi||0)-(cur.phi||0));
          const dth  = Math.abs((w.theta||0)-(cur.theta||0));
          const ang  = Math.sqrt(dphi*dphi+dth*dth);
          const ds   = Math.abs((w.score||0)-(cur.score||0))/5;
          return { w, d: 0.55*ang+0.45*ds };
        })
        .filter(x => x.d < 0.5 && x.d > 0.02)
        .sort((a,b) => a.d-b.d).slice(0,8);
      if (!nearby.length) { stopVoyage(); return; }
      const pick = nearby[Math.floor(Math.random()*Math.min(5,nearby.length))].w;
      setVoyageCurrent(pick);
      setSelectedWork(pick);
      scheduleNext(pick);
    }, 4500);
  }

  function stopVoyage() {
    setVoyageMode(false); setVoyageCurrent(null);
    clearTimeout(voyageTimer.current);
  }
  useEffect(() => () => clearTimeout(voyageTimer.current), []);

  // ── Compare ────────────────────────────────────────────────────
  function toggleCompare() {
    if (compareMode) { setCompareMode(false); setCompareA(null); setCompareB(null); }
    else             { setCompareMode(true); stopVoyage(); }
  }

  // ── Sélection (gère aussi le mode compare) ────────────────────
  function handleSelect(work) {
    if (compareMode) {
      if (!compareA) { setCompareA(work); return; }
      if (!compareB && work.id !== compareA?.id) { setCompareB(work); return; }
      // Remplacer A si on reclique
      setCompareA(work); setCompareB(null); return;
    }
    if (!voyageMode && selectedWork?.id === work?.id) {
      setSelectedWork(null); setPanelTab("fiche");
    } else {
      setSelectedWork(work);
      setNearbyWorks([]); setTrajectoryWorks([]);
      setPanelTab("fiche");
    }
    setHoveredWork(null);
  }

  // ── Explorer autour ────────────────────────────────────────────
  function exploreAround(work) {
    if (!work) return;
    const nearby = worksSeed
      .filter(w => w.id !== work.id)
      .map(w => {
        const dphi = Math.abs((w.phi||0)-(work.phi||0));
        const dth  = Math.abs((w.theta||0)-(work.theta||0));
        const ang  = Math.sqrt(dphi*dphi+dth*dth);
        const ds   = Math.abs((w.score||0)-(work.score||0))/5;
        return { ...w, _d: 0.6*ang+0.4*ds };
      })
      .filter(w => w._d < 0.6).sort((a,b) => a._d-b._d).slice(0,12);
    setNearbyWorks(nearby); setPanelTab("autour");
  }

  function showTrajectory(work) {
    if (!work) return;
    const traj = worksSeed.filter(w => w.artist === work.artist)
      .sort((a,b) => (a.score||0)-(b.score||0));
    setTrajectoryWorks(traj); setPanelTab("trajectoire");
  }

  const filteredWorks = useMemo(() =>
    applyFilters(worksSeed, { biome: biomeFilter, scoreMin, scoreMax, decade }),
  [biomeFilter, scoreMin, scoreMax, decade]);

  const T = dark ? THEME.dark : THEME.light;

  const modeLabel = compareMode ? "comparer"
    : voyageMode ? "voyage"
    : scoreMin > 7.5 ? "montagnes"
    : scoreMax < 5 ? "frontières"
    : decade ? `${decade}s`
    : biomeFilter !== "all" ? BIOME_META[biomeFilter]?.label?.toLowerCase()
    : "globe";

  const sep = <div style={{ width:1, height:14, background: T.border, margin:"0 3px", flexShrink:0 }} />;

  return (
    <div style={{ ...S.page, background: T.bg, color: T.text }}>

      {showOnboarding && <Onboarding dark={dark} onChoose={handleOnboardingChoice} />}

      <div style={S.stage}>
        <GlobeScene
          works={filteredWorks}
          selectedWork={compareMode ? (compareA || null) : selectedWork}
          hoveredWork={hoveredWork}
          onSelectWork={handleSelect}
          onHoverWork={setHoveredWork}
          activeFilter={biomeFilter}
          dark={dark}
          nearbyWorks={nearbyWorks}
          trajectoryWorks={trajectoryWorks}
        />
      </div>

      {/* Indicateur voyage */}
      {voyageMode && voyageCurrent && (
        <div style={{ ...S.voyageIndicator, background: T.cardBg, borderColor: T.border }}>
          <span style={{ width:6, height:6, borderRadius:"50%", flexShrink:0,
            background: BIOME_META[voyageCurrent.biome||voyageCurrent.regime]?.color || T.text,
            animation:"pulse 1.5s infinite" }} />
          <div>
            <div style={{ fontSize:9, color: T.muted, letterSpacing:"0.12em",
              textTransform:"uppercase", fontFamily:"'DM Mono',monospace" }}>En voyage</div>
            <div style={{ fontSize:11, color: T.text, fontStyle:"italic" }}>
              {voyageCurrent.title}
            </div>
          </div>
          <button onClick={stopVoyage} style={{
            background:"none", border:`1px solid ${T.border}`, color: T.muted,
            fontSize:9, padding:"3px 6px", cursor:"pointer", borderRadius:1,
            letterSpacing:"0.12em", fontFamily:"'DM Mono',monospace",
          }}>STOP</button>
        </div>
      )}

      {/* Panel compare */}
      {compareMode && (
        <ComparePanel
          workA={compareA} workB={compareB}
          onClearA={() => setCompareA(null)}
          onClearB={() => setCompareB(null)}
          dark={dark} T={T}
        />
      )}

      {/* ── Nav ──────────────────────────────────────────────── */}
      {mobile ? (
        /* ── Nav mobile — barre d'icônes minimale en bas ── */
        <nav style={{
          position:"absolute", bottom:0, left:0, right:0,
          zIndex:20, display:"flex", alignItems:"center",
          justifyContent:"space-around",
          padding:"10px 8px",
          paddingBottom:"max(10px, env(safe-area-inset-bottom))",
          background: T.navBg, borderTop:`1px solid ${T.border}`,
          backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
          // NE PAS intercepter les touches du globe au-dessus
          touchAction:"auto",
        }}>
          <button style={S.mobileBtn(T)} onClick={() => landRandom()} title="Aléatoire">
            <span style={S.mobileBtnIcon}>◎</span>
            <span style={S.mobileBtnLabel(T)}>Hasard</span>
          </button>
          <button style={S.mobileBtn(T)} onClick={() => voyageMode ? stopVoyage() : startVoyage(selectedWork||undefined)}>
            <span style={{ ...S.mobileBtnIcon, color: voyageMode ? T.text : T.muted }}>
              {voyageMode ? "◼" : "▷"}
            </span>
            <span style={S.mobileBtnLabel(T)}>Voyage</span>
          </button>
          <button style={S.mobileBtn(T)} onClick={() => setBiomeFilter("all")}>
            <span style={S.mobileBtnIcon}>○</span>
            <span style={S.mobileBtnLabel(T)}>Biomes</span>
          </button>
          <button style={S.mobileBtn(T)} onClick={toggleCompare}>
            <span style={{ ...S.mobileBtnIcon, color: compareMode ? T.text : T.muted }}>⊕</span>
            <span style={S.mobileBtnLabel(T)}>Comp.</span>
          </button>
          <button style={S.mobileBtn(T)} onClick={toggleDark}>
            <span style={S.mobileBtnIcon}>{dark ? "◐" : "◑"}</span>
            <span style={S.mobileBtnLabel(T)}>{dark ? "Clair" : "Sombre"}</span>
          </button>
          <button style={S.mobileBtn(T)} onClick={() => { setBiomeFilter("all"); setScoreMin(2); setScoreMax(10); setDecade(null); stopVoyage(); setCompareMode(false); }}>
            <span style={S.mobileBtnIcon}>↺</span>
            <span style={S.mobileBtnLabel(T)}>Reset</span>
          </button>
        </nav>
      ) : (
        /* ── Nav desktop — barre complète ── */
        <nav style={{ ...S.nav, background: T.navBg, borderColor: T.border }}>

          {/* Biomes */}
          <div style={S.navGroup}>
            {Object.entries(BIOME_META).map(([key, meta]) => {
              const active = biomeFilter === key;
              return (
                <button key={key} style={{
                  ...S.navBtn,
                  color: active && meta.color ? meta.color : active ? T.text : T.muted,
                  borderColor: active ? (meta.color || T.border) : "transparent",
                  background:  active ? T.pill : "transparent",
                }} onClick={() => setBiomeFilter(key)}>
                  {meta.color && <span style={{ ...S.dot, background: meta.color, opacity: active ? 1 : 0.4 }} />}
                  {meta.label}
                </button>
              );
            })}
          </div>

          {sep}

          <div style={{ display:"flex", gap:10, alignItems:"center", minWidth:220 }}>
            <Slider label="Min" value={scoreMin} min={2} max={9} step={0.5}
              onChange={setScoreMin} T={T} fmt={v => v.toFixed(1)} />
            <Slider label="Max" value={scoreMax} min={3} max={10} step={0.5}
              onChange={setScoreMax} T={T} fmt={v => v.toFixed(1)} />
          </div>

          {sep}

          <div style={{ display:"flex", gap:2, alignItems:"center", flexShrink:0 }}>
            {DECADES.map(d => {
              const active = decade === d;
              return (
                <button key={d ?? "all"} style={{
                  ...S.navBtn, padding:"5px 6px", fontSize:9,
                  color: active ? T.text : T.muted,
                  borderColor: active ? T.border : "transparent",
                  background:  active ? T.pill : "transparent",
                }} onClick={() => setDecade(active ? null : d)}>
                  {d ? `${String(d).slice(2)}s` : "∞"}
                </button>
              );
            })}
          </div>

          {sep}

          <SearchBar dark={dark} T={T} onSelect={w => {
            handleSelect(w); if (compareMode) return;
            setBiomeFilter("all");
          }} />

          {sep}

          <div style={{ display:"flex", gap:3, flexShrink:0 }}>
            <button title="Atterrir au hasard" style={{ ...S.navBtn, color: T.muted, borderColor:"transparent" }}
              onClick={() => landRandom()}>◎</button>
            <button title={voyageMode ? "Arrêter" : "Voyager"} style={{
              ...S.navBtn,
              color: voyageMode ? T.text : T.muted,
              borderColor: voyageMode ? T.border : "transparent",
              background:  voyageMode ? T.pill : "transparent",
            }} onClick={() => voyageMode ? stopVoyage() : startVoyage(selectedWork||undefined)}>
              {voyageMode ? "◼" : "▷"}
            </button>
            <button title="Comparer" style={{
              ...S.navBtn,
              color: compareMode ? T.text : T.muted,
              borderColor: compareMode ? T.border : "transparent",
              background:  compareMode ? T.pill : "transparent",
            }} onClick={toggleCompare}>⊕</button>
            <button title="Réinitialiser" style={{ ...S.navBtn, color: T.muted, borderColor:"transparent" }}
              onClick={() => { setBiomeFilter("all"); setScoreMin(2); setScoreMax(10); setDecade(null); stopVoyage(); setCompareMode(false); }}>
              ↺
            </button>
            <button style={{ ...S.navBtn, color: T.muted, borderColor:"transparent" }}
              onClick={toggleDark}>{dark ? "◐" : "◑"}</button>
          </div>
        </nav>
      )}

      {/* Hover card */}
      {hoveredWork && !selectedWork && !compareMode && (
        <div style={{ ...S.hoverCard, background: T.cardBg, borderColor: T.border }}>
          {BIOME_META[hoveredWork.biome||hoveredWork.regime]?.color && (
            <span style={{ ...S.hoverDot, background: BIOME_META[hoveredWork.biome||hoveredWork.regime].color }} />
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontStyle:"italic", color: T.text,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {hoveredWork.title}
            </div>
            <div style={{ fontSize:10, color: T.muted, marginTop:2,
              fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em" }}>
              {hoveredWork.artist}
              {hoveredWork.year && <span style={{ marginLeft:6, opacity:0.6 }}>{hoveredWork.year}</span>}
            </div>
          </div>
          {hoveredWork.score && (
            <span style={{ fontSize:11, color: T.muted, fontFamily:"'DM Mono',monospace", flexShrink:0 }}>
              {Number(hoveredWork.score).toFixed(1)}
            </span>
          )}
        </div>
      )}

      {/* Mode compare — instruction */}
      {compareMode && !compareA && (
        <div style={{ ...S.hoverCard, background: T.cardBg, borderColor: T.border,
          pointerEvents:"none" }}>
          <span style={{ fontSize:10, color: T.muted, fontFamily:"'DM Mono',monospace",
            letterSpacing:"0.1em" }}>Cliquez une première œuvre sur le globe</span>
        </div>
      )}
      {compareMode && compareA && !compareB && (
        <div style={{ ...S.hoverCard, background: T.cardBg, borderColor: T.border,
          pointerEvents:"none" }}>
          <span style={{ fontSize:10, color: T.muted, fontFamily:"'DM Mono',monospace",
            letterSpacing:"0.1em" }}>Cliquez une deuxième œuvre à comparer</span>
        </div>
      )}

      {/* Wordmark */}
      <div style={S.wordmark}>
        <span style={{ display:"block", fontSize:20, fontStyle:"italic",
          letterSpacing:"-0.04em", color: T.text, lineHeight:1 }}>lisn</span>
        <span style={{ display:"block", fontSize:8, letterSpacing:"0.20em",
          color: T.muted, fontFamily:"'DM Mono',monospace", marginTop:3,
          textTransform:"uppercase" }}>
          {modeLabel} · {filteredWorks.length}
        </span>
        <span style={{ display:"block", fontSize:7, letterSpacing:"0.14em",
          color: T.muted, fontFamily:"'DM Mono',monospace", marginTop:4,
          opacity:0.55, textTransform:"uppercase" }}>
          Expand your musical taste
        </span>
      </div>

      {/* Panel sélection — caché en mode compare */}
      {!compareMode && (
        <WorkPanel
          work={selectedWork}
          onClose={() => { setSelectedWork(null); setPanelTab("fiche"); if (voyageMode) stopVoyage(); }}
          dark={dark} tab={panelTab} onTabChange={setPanelTab}
          nearbyWorks={nearbyWorks} trajectoryWorks={trajectoryWorks}
          onExploreAround={() => exploreAround(selectedWork)}
          onShowTrajectory={() => showTrajectory(selectedWork)}
          onSelectWork={handleSelect}
          onStartVoyage={() => startVoyage(selectedWork)}
          voyageMode={voyageMode}
          onRequestAnalysis={w => setAnalysisWork(w)}
        />
      )}

      {/* Modal analyse mock */}
      {analysisWork && (
        <AnalysisModal
          work={analysisWork}
          dark={dark}
          onClose={() => setAnalysisWork(null)}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}

const S = {
  page:    { width:"100vw", height:"100vh", position:"relative", overflow:"hidden",
             fontFamily:"'Libre Baskerville', Georgia, serif" },
  stage:   { position:"absolute", inset:0 },
  nav: {
    position:"absolute", bottom:18, left:"50%", transform:"translateX(-50%)",
    zIndex:20, display:"flex", alignItems:"center", gap:3,
    padding:"6px 10px", borderRadius:2, border:"1px solid",
    backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
    maxWidth:"calc(100vw - 24px)", overflowX:"auto",
  },
  navGroup: { display:"flex", alignItems:"center", gap:2, flexShrink:0 },
  navBtn: {
    background:"none", border:"1px solid", borderRadius:1,
    fontSize:10, letterSpacing:"0.12em", padding:"5px 7px",
    cursor:"pointer", display:"flex", alignItems:"center", gap:4,
    fontFamily:"'DM Mono','Courier New',monospace", textTransform:"uppercase",
    transition:"all 0.12s", whiteSpace:"nowrap", flexShrink:0,
  },
  dot:  { width:5, height:5, borderRadius:"50%", flexShrink:0 },
  hoverCard: {
    position:"absolute", bottom:72, left:"50%", transform:"translateX(-50%)",
    border:"1px solid", borderRadius:1, padding:"9px 14px",
    pointerEvents:"none", backdropFilter:"blur(12px)",
    display:"flex", alignItems:"center", gap:10, minWidth:180, maxWidth:300,
  },
  hoverDot: { width:7, height:7, borderRadius:"50%", flexShrink:0 },
  voyageIndicator: {
    position:"absolute", top:18, right:20, zIndex:30,
    display:"flex", alignItems:"center", gap:8,
    padding:"8px 12px", borderRadius:1, border:"1px solid",
    backdropFilter:"blur(12px)", fontFamily:"'DM Mono',monospace",
  },
  wordmark: { position:"absolute", top:18, left:20, zIndex:10 },
  mobileBtn: T => ({
    background:"none", border:"none", cursor:"pointer",
    display:"flex", flexDirection:"column", alignItems:"center", gap:3,
    padding:"4px 6px", minWidth:44,
  }),
  mobileBtnIcon: { fontSize:16, color:"inherit", lineHeight:1 },
  mobileBtnLabel: T => ({
    fontSize:8, color: T.muted, fontFamily:"'DM Mono',monospace",
    letterSpacing:"0.10em", textTransform:"uppercase",
  }),
};
