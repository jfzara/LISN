"use client";

const BIOME_COLOR = {
  dense: "#FF6B2F", atmospheric: "#4ABFFF", structural: "#E8C97A",
  narrative: "#FF9A4D", hybrid: "#C07AE8",
};
const BIOME_LABEL = {
  dense: "Dense", atmospheric: "Atmosphérique", structural: "Structural",
  narrative: "Narratif", hybrid: "Hybride",
};
const ROLE_LABEL = {
  capital: "Capitale", city: "Ville", village: "Village",
  bridge: "Pont", island: "Île", hamlet: "Hameau",
};

// ── Score bar ─────────────────────────────────────────────────────
function ScoreBar({ score, dark }) {
  const pct   = Math.round((score / 10) * 100);
  const color = score >= 9.0 ? "#FF6B2F" : score >= 8.0 ? "#E8C97A" : score >= 7.0 ? "#4ABFFF"
              : dark ? "rgba(232,223,200,0.30)" : "rgba(26,20,16,0.22)";
  const trackBg = dark ? "rgba(232,223,200,0.07)" : "rgba(26,20,16,0.08)";
  const labelC  = dark ? "rgba(232,223,200,0.38)" : "rgba(26,20,16,0.38)";
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5,
        fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color: labelC,
        fontFamily:"'DM Mono', monospace" }}>
        <span>Score OSR</span>
        <span style={{ color, fontWeight:500, fontSize:11 }}>{score.toFixed(1)}</span>
      </div>
      <div style={{ height:1, background: trackBg, position:"relative" }}>
        <div style={{ position:"absolute", left:0, top:0, height:"100%",
          width:`${pct}%`, background: color, transition:"width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ── Onglets ───────────────────────────────────────────────────────
function Tabs({ tab, onChange, dark }) {
  const text  = dark ? "#e8dfc8" : "#1a1410";
  const muted = dark ? "rgba(232,223,200,0.38)" : "rgba(26,20,16,0.38)";
  const bord  = dark ? "rgba(232,223,200,0.10)" : "rgba(26,20,16,0.10)";
  const tabs  = [
    { key: "fiche",       label: "Fiche" },
    { key: "autour",      label: "Autour" },
    { key: "trajectoire", label: "Trajectoire" },
  ];
  return (
    <div style={{ display:"flex", borderBottom:`1px solid ${bord}`, marginBottom:14 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          flex:1, padding:"8px 4px", background:"none", border:"none",
          cursor:"pointer", fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase",
          fontFamily:"'DM Mono', monospace",
          color: tab === t.key ? text : muted,
          borderBottom: tab === t.key
            ? `1px solid ${text}` : "1px solid transparent",
          marginBottom: -1, transition:"all 0.12s",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ── Fiche principale ──────────────────────────────────────────────
function FicheTab({ work, dark, onExploreAround, onShowTrajectory, onStartVoyage, voyageMode, onRequestAnalysis }) {
  const text  = dark ? "#e8dfc8" : "#1a1410";
  const muted = dark ? "rgba(232,223,200,0.42)" : "rgba(26,20,16,0.42)";
  const bord  = dark ? "rgba(232,223,200,0.08)" : "rgba(26,20,16,0.10)";
  const pill  = dark ? "rgba(232,223,200,0.07)" : "rgba(26,20,16,0.06)";
  const biome = work.biome || work.regime;

  const metaItems = [
    { label:"Type",  val: work.entityType === "album" ? "Album" : work.entityType === "artist" ? "Artiste" : "Morceau" },
    { label:"Biome", val: BIOME_LABEL[biome] || biome || "—", color: BIOME_COLOR[biome] },
    { label:"Rôle",  val: ROLE_LABEL[work.role] || work.role || "—" },
    { label:"Année", val: work.year || "—" },
  ];

  return (
    <>
      {typeof work.score === "number" && <ScoreBar score={work.score} dark={dark} />}

      {/* Méta 2×2 */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:14 }}>
        {metaItems.map(({ label, val, color }) => (
          <div key={label} style={{ padding:"8px 10px", border:`1px solid ${bord}`, borderRadius:1 }}>
            <div style={{ fontSize:9, letterSpacing:"0.12em", textTransform:"uppercase",
              color: muted, marginBottom:3, fontFamily:"'DM Mono', monospace" }}>{label}</div>
            <div style={{ fontSize:12, fontWeight:500, color: color || text }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:16 }}>
        <button onClick={onExploreAround} style={{ ...btnStyle(bord, text) }}>
          <span style={{ opacity:0.55, marginRight:6 }}>◎</span> Explorer autour
        </button>
        <button onClick={onShowTrajectory} style={{ ...btnStyle(bord, text) }}>
          <span style={{ opacity:0.55, marginRight:6 }}>—</span> Trajectoire de l'artiste
        </button>
        <button onClick={() => onRequestAnalysis?.(work)} style={{
          ...btnStyle(bord, text),
          background: BIOME_COLOR[biome] || bord,
          borderColor: "transparent",
          color: dark ? "#080604" : "#ffffff",
          fontWeight: 500,
          opacity: 1,
        }}>
          <span style={{ marginRight:6 }}>→</span> Analyser dans LISN
        </button>
        {onStartVoyage && (
          <button onClick={onStartVoyage} style={{
            ...btnStyle(bord, text),
            borderColor: voyageMode ? text : bord,
            background: voyageMode ? pill : "none",
          }}>
            <span style={{ opacity:0.55, marginRight:6 }}>{voyageMode ? "◼" : "▷"}</span>
            {voyageMode ? "Arrêter le voyage" : "Voyager depuis ici"}
          </button>
        )}
      </div>
    </>
  );
}

// ── Onglet Autour ────────────────────────────────────────────────
function AutourTab({ works, dark, onSelectWork }) {
  const text  = dark ? "#e8dfc8" : "#1a1410";
  const muted = dark ? "rgba(232,223,200,0.42)" : "rgba(26,20,16,0.42)";
  const bord  = dark ? "rgba(232,223,200,0.08)" : "rgba(26,20,16,0.10)";
  const hover = dark ? "rgba(232,223,200,0.05)" : "rgba(26,20,16,0.04)";

  if (works.length === 0) {
    return <div style={{ fontSize:12, color: muted, marginTop:8, lineHeight:1.6 }}>
      Cliquez "Explorer autour" sur la fiche pour voir les œuvres proches.
    </div>;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {works.map(w => (
        <button key={w.id} onClick={() => onSelectWork(w)} style={{
          display:"flex", alignItems:"center", gap:8,
          background:"none", border:`1px solid ${bord}`, borderRadius:1,
          padding:"8px 10px", cursor:"pointer", textAlign:"left",
          transition:"background 0.1s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = hover}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <span style={{ width:6, height:6, borderRadius:"50%", flexShrink:0,
            background: BIOME_COLOR[w.biome] || "#888" }} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, color: text, fontStyle:"italic",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {w.title}
            </div>
            <div style={{ fontSize:10, color: muted, fontFamily:"'DM Mono', monospace",
              letterSpacing:"0.06em", marginTop:1 }}>{w.artist}</div>
          </div>
          <span style={{ fontSize:10, color: muted, fontFamily:"'DM Mono', monospace",
            flexShrink:0 }}>{Number(w.score||0).toFixed(1)}</span>
        </button>
      ))}
    </div>
  );
}

// ── Onglet Trajectoire ───────────────────────────────────────────
function TrajectoireTab({ works, dark, onSelectWork }) {
  const text  = dark ? "#e8dfc8" : "#1a1410";
  const muted = dark ? "rgba(232,223,200,0.42)" : "rgba(26,20,16,0.42)";
  const bord  = dark ? "rgba(232,223,200,0.08)" : "rgba(26,20,16,0.10)";
  const hover = dark ? "rgba(232,223,200,0.05)" : "rgba(26,20,16,0.04)";
  const line  = dark ? "rgba(232,223,200,0.12)" : "rgba(26,20,16,0.12)";

  if (works.length === 0) {
    return <div style={{ fontSize:12, color: muted, marginTop:8, lineHeight:1.6 }}>
      Cliquez "Trajectoire" sur la fiche pour voir l'évolution de l'artiste.
    </div>;
  }

  // Trouver le min/max pour la barre de progression relative
  const scores = works.map(w => w.score || 0);
  const minS   = Math.min(...scores);
  const maxS   = Math.max(...scores);
  const range  = maxS - minS || 1;

  return (
    <div>
      {/* Header artiste */}
      <div style={{ fontSize:11, color: muted, letterSpacing:"0.10em", marginBottom:12,
        fontFamily:"'DM Mono', monospace", textTransform:"uppercase" }}>
        {works[0]?.artist} · {works.length} œuvres
      </div>

      <div style={{ position:"relative", paddingLeft:16 }}>
        {/* Ligne verticale */}
        <div style={{ position:"absolute", left:3, top:8, bottom:8, width:1, background: line }} />

        {works.map((w, i) => {
          const pct  = ((w.score || 0) - minS) / range;
          const col  = BIOME_COLOR[w.biome] || "#888";
          return (
            <button key={w.id} onClick={() => onSelectWork(w)} style={{
              display:"flex", alignItems:"flex-start", gap:10, marginBottom:8,
              background:"none", border:"none", cursor:"pointer", textAlign:"left",
              padding:"6px 8px", borderRadius:1, width:"100%",
              transition:"background 0.1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = hover}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {/* Dot sur la ligne */}
              <div style={{ position:"absolute", left:0, marginTop:6,
                width:7, height:7, borderRadius:"50%", background: col, flexShrink:0 }} />

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color: text, fontStyle:"italic",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {w.title}
                </div>
                {/* Mini barre de score relative */}
                <div style={{ height:1, background: bord, marginTop:4, position:"relative" }}>
                  <div style={{ position:"absolute", left:0, top:0, height:"100%",
                    width:`${Math.round(pct * 100)}%`, background: col,
                    opacity: 0.6, transition:"width 0.3s" }} />
                </div>
              </div>
              <span style={{ fontSize:10, color: muted, fontFamily:"'DM Mono', monospace",
                flexShrink:0, marginTop:1 }}>{Number(w.score||0).toFixed(1)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────
function btnStyle(bord, text) {
  return {
    width:"100%", padding:"9px 12px",
    background:"none", border:`1px solid ${bord}`,
    color: text, fontSize:10, letterSpacing:"0.13em",
    textTransform:"uppercase", cursor:"pointer", borderRadius:1,
    fontFamily:"'DM Mono', monospace",
    display:"flex", alignItems:"center",
    transition:"opacity 0.12s", opacity: 0.72,
  };
}

// ── Export principal ──────────────────────────────────────────────
export default function WorkPanel({
  work, onClose, dark = true,
  tab = "fiche", onTabChange,
  nearbyWorks = [], trajectoryWorks = [],
  onExploreAround, onShowTrajectory,
  onSelectWork,
  onStartVoyage, voyageMode = false,
  onRequestAnalysis,
}) {
  const isOpen = Boolean(work);
  const biome  = work?.biome || work?.regime;

  const bg   = dark ? "rgba(6,4,2,0.96)"       : "rgba(228,221,212,0.96)";
  const bord = dark ? "rgba(232,223,200,0.11)"  : "rgba(26,20,16,0.14)";
  const text = dark ? "#e8dfc8"                 : "#1a1410";
  const muted= dark ? "rgba(232,223,200,0.42)"  : "rgba(26,20,16,0.42)";

  return (
    <aside style={{
      position:"fixed", top:18, right:18, bottom:18,
      width:"min(300px, calc(100vw - 36px))",
      zIndex:40,
      background: bg,
      border:`1px solid ${bord}`,
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      transform: isOpen ? "translateX(0)" : "translateX(calc(100% + 28px))",
      transition:"transform 260ms cubic-bezier(0.22,1,0.36,1)",
      color: text,
      overflow:"hidden",
      borderRadius:1,
      fontFamily:"'Libre Baskerville', Georgia, serif",
      display:"flex", flexDirection:"column",
    }}>
      {work ? (
        <>
          {/* Bande biome */}
          <div style={{ height:2, background: BIOME_COLOR[biome] || bord, flexShrink:0 }} />

          {/* Header fixe */}
          <div style={{ padding:"14px 16px 0", flexShrink:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase", color: muted,
                fontFamily:"'DM Mono', monospace" }}>
                {BIOME_LABEL[biome] || "Œuvre"}
              </div>
              <button onClick={onClose} style={{
                background:"none", border:`1px solid ${bord}`, color: muted,
                fontSize:9, letterSpacing:"0.14em", padding:"3px 7px",
                cursor:"pointer", borderRadius:1, fontFamily:"'DM Mono', monospace",
              }}>✕</button>
            </div>
            <h2 style={{ margin:"8px 0 0", fontSize:20, lineHeight:1.1,
              letterSpacing:"-0.02em", fontStyle:"italic", color: text }}>
              {work.title}
            </h2>
            <div style={{ marginTop:5, fontSize:12, color: muted }}>{work.artist}</div>
          </div>

          {/* Onglets */}
          <div style={{ padding:"12px 16px 0", flexShrink:0 }}>
            <Tabs tab={tab} onChange={t => {
              onTabChange(t);
              if (t === "autour")      onExploreAround?.();
              if (t === "trajectoire") onShowTrajectory?.();
            }} dark={dark} />
          </div>

          {/* Contenu scrollable */}
          <div style={{ flex:1, overflowY:"auto", padding:"0 16px 20px" }}>
            {tab === "fiche" && (
              <FicheTab
                work={work} dark={dark}
                onExploreAround={() => { onTabChange("autour"); onExploreAround?.(); }}
                onShowTrajectory={() => { onTabChange("trajectoire"); onShowTrajectory?.(); }}
                onStartVoyage={onStartVoyage}
                voyageMode={voyageMode}
                onRequestAnalysis={onRequestAnalysis}
              />
            )}
            {tab === "autour" && (
              <AutourTab works={nearbyWorks} dark={dark} onSelectWork={onSelectWork} />
            )}
            {tab === "trajectoire" && (
              <TrajectoireTab works={trajectoryWorks} dark={dark} onSelectWork={onSelectWork} />
            )}
          </div>
        </>
      ) : (
        <div style={{ padding:"28px 18px", flex:1, display:"flex", alignItems:"center" }}>
          <div style={{ fontSize:13, color: muted, lineHeight:1.65 }}>
            Survolez une présence lumineuse,<br />cliquez pour ouvrir sa fiche.
          </div>
        </div>
      )}
    </aside>
  );
}
