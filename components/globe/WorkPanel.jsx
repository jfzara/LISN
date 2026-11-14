"use client";

import { useState, useEffect } from "react";
import AudioPlayer from "./AudioPlayer";
import { contrastOn } from "@/lib/lisn/tint";

const BIOME_COLOR = {
  dense: "#8c8c8c", atmospheric: "#8c8c8c", structural: "#8c8c8c",
  narrative: "#8c8c8c", hybrid: "#8c8c8c",
};

// Labels bilingues
const BIOME_LABEL = {
  fr: { dense:"Dense", atmospheric:"Atmosphérique", structural:"Structurel", narrative:"Narratif", hybrid:"Hybride" },
  en: { dense:"Dense", atmospheric:"Atmospheric",   structural:"Structural", narrative:"Narrative", hybrid:"Hybrid"  },
};

// Rôles — avec explication courte
const ROLE_LABEL = {
  fr: {
    capital: "Capitale",  city: "Ville",   village: "Village",
    bridge:  "Pont",      island: "Île",   hamlet:  "Hameau",
  },
  en: {
    capital: "Capital",   city: "City",    village: "Village",
    bridge:  "Bridge",    island: "Island", hamlet: "Hamlet",
  },
};

const ROLE_DESC = {
  fr: {
    capital: "Œuvre fondatrice — sommet de la carte",
    city:    "Œuvre majeure — haute densité structurelle",
    village: "Œuvre solide — bien construite",
    bridge:  "Œuvre de transition — relie deux zones",
    island:  "Œuvre isolée — singulière, sans voisins proches",
    hamlet:  "Œuvre mineure ou de niche",
  },
  en: {
    capital: "Landmark work — peak of the map",
    city:    "Major work — high structural density",
    village: "Solid work — well-constructed",
    bridge:  "Transitional work — bridges two zones",
    island:  "Isolated work — singular, few close neighbours",
    hamlet:  "Minor or niche work",
  },
};

// Le seed mélange clés françaises et anglaises pour les rôles
const ROLE_ALIAS = { capitale:"capital", ville:"city", pont:"bridge" };

// Textes UI panel
const PANEL_UI = {
  fr: {
    close: "Fermer", score: "Score OSR", role: "Rôle", zone: "Zone",
    type: "Type", year: "Année",
    exploreAround: "Explorer autour", trajectory: "Trajectoire de l'artiste",
    voyage: "Voyager depuis ici", voyageStop: "Arrêter le voyage",
    analyse: "Analyser dans LISN →",
    discuss: "Discuter avec LISN",
    tabFiche: "Fiche", tabAround: "Autour", tabTrajectory: "Trajectoire",
    emptyHint: "Survole un point, clique pour ouvrir sa fiche.",
    autourEmpty: "Clique sur l'onglet Autour depuis la fiche pour voir les œuvres proches.",
    trajectoryEmpty: "Clique sur la fiche pour voir l'évolution de l'artiste.",
    types: { album:"Album", artist:"Artiste", track:"Morceau" },
  },
  en: {
    close: "Close", score: "OSR Score", role: "Role", zone: "Zone",
    type: "Type", year: "Year",
    exploreAround: "Explore around", trajectory: "Artist trajectory",
    voyage: "Voyage from here", voyageStop: "Stop voyage",
    analyse: "Analyse in LISN →",
    discuss: "Discuss with LISN",
    tabFiche: "Info", tabAround: "Around", tabTrajectory: "Trajectory",
    emptyHint: "Hover a luminous point, click to open its card.",
    autourEmpty: "Click the Around tab on the card to see nearby works.",
    trajectoryEmpty: "Click the card to see the artist's evolution.",
    types: { album:"Album", artist:"Artist", track:"Track" },
  },
};

// ── Pochette — l'œuvre en héros ───────────────────────────────────
// Va chercher la pochette via /api/cover ; sinon, une pochette
// typographique sobre aux couleurs de la zone.
function Cover({ work, url, tint, size = "100%", radius = 0 }) {
  const [loaded, setLoaded] = useState(null);
  const ok = !!url && loaded === url;
  const bg = tint || "#8c8c8c";
  return (
    <div style={{ width:size, aspectRatio:"1 / 1", position:"relative", overflow:"hidden",
      borderRadius:radius, flexShrink:0, background:bg, transition:"background 500ms ease" }}>
      {size === "100%" && (
        <div style={{ position:"absolute", left:"8%", right:"8%", bottom:"8%",
          color: contrastOn(bg), fontWeight:800, letterSpacing:"-0.05em", lineHeight:1.0,
          fontSize:40, paddingBottom:6, overflow:"hidden",
          display:"-webkit-box", WebkitLineClamp:4, WebkitBoxOrient:"vertical" }}>
          {work?.title}
        </div>
      )}
      {url && (
        <img key={url} src={url} alt="" onLoad={() => setLoaded(url)}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover",
            opacity: ok ? 1 : 0, transition:"opacity 400ms ease" }} />
      )}
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────
function ScoreBar({ score, dark }) {
  const pct   = Math.round((score / 10) * 100);
  const color = dark ? "#ffffff" : "#000000";
  const trackBg = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)";
  const labelC  = dark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.58)";
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5,
        fontSize:11, letterSpacing:"0.005em", textTransform:"none", color: labelC,
        fontFamily:"var(--font-ui)" }}>
        <span>Score OSR</span>
        <span style={{ color, fontWeight:500, fontSize:12 }}>{score.toFixed(1)}</span>
      </div>
      <div style={{ height:1, background: trackBg, position:"relative" }}>
        <div style={{ position:"absolute", left:0, top:0, height:"100%",
          width:`${pct}%`, background: color, transition:"width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ── Onglets ───────────────────────────────────────────────────────
function Tabs({ tab, onChange, dark, lang = "fr" }) {
  const text  = dark ? "#ffffff" : "#000000";
  const muted = dark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.58)";
  const bord  = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const P2 = PANEL_UI[lang] || PANEL_UI.fr;
  const tabs  = [
    { key: "fiche",       label: P2.tabFiche },
    { key: "autour",      label: P2.tabAround },
    { key: "trajectoire", label: P2.tabTrajectory },
  ];
  return (
    <div style={{ display:"flex", marginBottom:14 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          flex:1, padding:"8px 4px", background:"none", border:"none",
          cursor:"pointer", fontSize:11, letterSpacing:"0.005em", textTransform:"none",
          fontFamily:"var(--font-ui)",
          color: tab === t.key ? text : muted,
          borderBottom: tab === t.key
            ? `2px solid ${text}` : "2px solid transparent",
          fontWeight: tab === t.key ? 700 : 400, transition:"all 0.12s",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ── Fiche principale ──────────────────────────────────────────────
function FicheTab({ work, dark, lang = "fr", onExploreAround, onShowTrajectory, onStartVoyage, voyageMode, onRequestAnalysis, onRequestDiscuss, isFavorite = false, onToggleFavorite, mobile = false, activeMode = "free" }) {
  const P  = PANEL_UI[lang] || PANEL_UI.fr;

  // Indicateur de mode actif
  const MODE_META = {
    random:    { color:"#8c8c8c", icon:"◉", fr:"Je tourne en rond",          en:"Explore mode" },
    mountains: { color:"#ffffff", icon:"△", fr:"Ce qui compte vraiment",     en:"Peaks mode" },
    frontier:  { color:"#ffffff", icon:"◇", fr:"Sortir de ma zone",          en:"Frontier mode" },
    free:      { color:null,      icon:"○", fr:"Navigation libre",           en:"Free navigation" },
  };
  const modeMeta = MODE_META[activeMode] || MODE_META.free;
  const modeLabel = lang === "fr" ? modeMeta.fr : modeMeta.en;
  const BL = BIOME_LABEL[lang] || BIOME_LABEL.fr;
  const RL = ROLE_LABEL[lang]  || ROLE_LABEL.fr;
  const RD = ROLE_DESC[lang]   || ROLE_DESC.fr;
  const text  = dark ? "#ffffff" : "#000000";
  const muted = dark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.58)";
  const bord  = dark ? "rgba(255,255,255,0.34)" : "rgba(0,0,0,0.34)";
  const pill  = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const biome = work.biome || work.regime;

  const metaItems = [
    { label: P.type, val: P.types[work.entityType] || work.entityType || "—" },
    { label: P.zone, val: BL[biome] || biome || "—", color: BIOME_COLOR[biome] },
    { label: P.role, val: RL[work.role] || work.role || "—" },
    { label: P.year, val: work.year || "—" },
  ];

  return (
    <>
      {/* Écouter d'abord */}
      <AudioPlayer key={work.id} work={work} dark={dark} lang={lang} />

      <div style={{ marginTop:14, fontSize:13, color: muted, lineHeight:1.5 }}>
        {[BL[biome], RD[ROLE_ALIAS[work.role] || work.role]].filter(Boolean).join(". ")}
      </div>

      {typeof work.score === "number" && <ScoreBar score={work.score} dark={dark} />}

      {/* Favoris + Actions — sticky en bas sur mobile */}
      {onToggleFavorite && (
        <button onClick={onToggleFavorite} style={{
          ...btnStyle(bord, text, mobile), marginTop:16,
          fontWeight: isFavorite ? 700 : 400,
          color: text,
        }}>
          <span style={{ fontSize:14, marginRight:6 }}>{isFavorite ? "♥" : "♡"}</span>
          {lang === "fr"
            ? (isFavorite ? "Sauvegardé" : "Sauvegarder")
            : (isFavorite ? "Saved" : "Save")}
        </button>
      )}

      {/* Actions */}
      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
        <button onClick={onExploreAround} style={{ ...btnStyle(bord, text) }}>
          {P.exploreAround}
        </button>
        <button onClick={onShowTrajectory} style={{ ...btnStyle(bord, text) }}>
          {P.trajectory}
        </button>
        <button onClick={() => onRequestAnalysis?.(work)} style={{
          ...btnStyle(bord, text),
          background: text,
          borderStyle: "none", padding:"13px 12px", margin:"6px 0",
          color: dark ? "#000000" : "#ffffff",
          fontWeight: 600,
          opacity: 1,
        }}>
          {P.analyse}
        </button>
        {onStartVoyage && (
          <button onClick={onStartVoyage} style={{
            ...btnStyle(bord, text),
            fontWeight: voyageMode ? 700 : 400,
          }}>
            {voyageMode ? P.voyageStop : P.voyage}
          </button>
        )}
        {onRequestDiscuss && (
          <button onClick={() => onRequestDiscuss?.(work)} style={{
            ...btnStyle(bord, text),
          }}>
            
            {P.discuss}
            <span style={{
              marginLeft:"auto", fontSize:11, letterSpacing:"0.005em",
              padding:"2px 5px", borderRadius:0,
              background: BIOME_COLOR[biome] ? `${BIOME_COLOR[biome]}30` : bord,
              color: BIOME_COLOR[biome] || text,
              fontFamily:"var(--font-ui)", textTransform:"none",
            }}>PRO</span>
          </button>
        )}
      </div>
    </>
  );
}

// ── Onglet Autour ────────────────────────────────────────────────
function AutourTab({ works, dark, lang = "fr", onSelectWork }) {
  const P = PANEL_UI[lang] || PANEL_UI.fr;
  const text  = dark ? "#ffffff" : "#000000";
  const muted = dark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.58)";
  const bord  = dark ? "rgba(255,255,255,0.34)" : "rgba(0,0,0,0.34)";
  const hover = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  if (works.length === 0) {
    return <div style={{ fontSize:13, color: muted, marginTop:8, lineHeight:1.6 }}>
      Clique P.exploreAround sur la fiche pour voir les œuvres proches.
    </div>;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {works.map(w => (
        <button key={w.id} onClick={() => onSelectWork(w)} style={{
          display:"flex", alignItems:"center", gap:8,
          background:"none", border:"none", borderTop:`2px dotted ${bord}`, borderRadius:0,
          padding:"10px 2px", cursor:"pointer", textAlign:"left",
          transition:"background 0.1s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = hover}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, color: text, fontStyle:"normal",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {w.title}
            </div>
            <div style={{ fontSize:12, color: muted, fontFamily:"var(--font-ui)",
              letterSpacing:"0.005em", marginTop:1 }}>{w.artist}</div>
          </div>
          <span style={{ fontSize:12, color: muted, fontFamily:"var(--font-ui)",
            flexShrink:0 }}>{Number(w.score||0).toFixed(1)}</span>
        </button>
      ))}
    </div>
  );
}

// ── Onglet Trajectoire ───────────────────────────────────────────
function TrajectoireTab({ works, dark, lang = "fr", onSelectWork }) {
  const P = PANEL_UI[lang] || PANEL_UI.fr;
  const text  = dark ? "#ffffff" : "#000000";
  const muted = dark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.58)";
  const bord  = dark ? "rgba(255,255,255,0.34)" : "rgba(0,0,0,0.34)";
  const hover = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const line  = dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)";

  if (works.length === 0) {
    return <div style={{ fontSize:13, color: muted, marginTop:8, lineHeight:1.6 }}>
      {P.trajectoryEmpty}
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
      <div style={{ fontSize:12, color: muted, letterSpacing:"0.005em", marginBottom:12,
        fontFamily:"var(--font-ui)", textTransform:"none" }}>
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
              padding:"6px 8px", borderRadius:0, width:"100%",
              transition:"background 0.1s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = hover}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {/* Dot sur la ligne */}
              <div style={{ position:"absolute", left:0, marginTop:6,
                width:7, height:7, borderRadius:"50%", background: col, flexShrink:0 }} />

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color: text, fontStyle:"normal",
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
              <span style={{ fontSize:12, color: muted, fontFamily:"var(--font-ui)",
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
    // Une ligne, pas une boîte : les actions se suivent, séparées par un pointillé
    width:"100%", padding:"12px 2px",
    background:"none", borderWidth:"2px 0 0", borderStyle:"dotted", borderColor:bord,
    color: text, fontSize:14, cursor:"pointer", borderRadius:0,
    fontFamily:"var(--font-ui)", textAlign:"left",
    display:"flex", alignItems:"center",
    transition:"opacity 0.12s", opacity: 1,
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
  onRequestDiscuss,
  mobile = false,
  lang = "fr",
  isFavorite = false,
  onToggleFavorite,
  coverUrl, tint,
  activeMode = "free",
}) {
  const P  = PANEL_UI[lang] || PANEL_UI.fr;
  const BL_wp = BIOME_LABEL[lang] || BIOME_LABEL.fr;

  // Indicateur de mode actif
  const MODE_META = {
    random:    { color:"#8c8c8c", icon:"◉", fr:"Je tourne en rond",          en:"Explore mode" },
    mountains: { color:"#ffffff", icon:"△", fr:"Ce qui compte vraiment",     en:"Peaks mode" },
    frontier:  { color:"#ffffff", icon:"◇", fr:"Sortir de ma zone",          en:"Frontier mode" },
    free:      { color:null,      icon:"○", fr:"Navigation libre",           en:"Free navigation" },
  };
  const modeMeta = MODE_META[activeMode] || MODE_META.free;
  const modeLabel = lang === "fr" ? modeMeta.fr : modeMeta.en;
  const BL = BIOME_LABEL[lang] || BIOME_LABEL.fr;
  const RL = ROLE_LABEL[lang]  || ROLE_LABEL.fr;
  const RD = ROLE_DESC[lang]   || ROLE_DESC.fr;
  const isOpen = Boolean(work);
  const biome  = work?.biome || work?.regime;

  const bg   = dark ? "#000000" : "#ffffff";
  const bord = dark ? "rgba(255,255,255,0.13)"  : "rgba(0,0,0,0.16)";
  const text = dark ? "#ffffff"                 : "#000000";
  const muted= dark ? "rgba(255,255,255,0.62)"  : "rgba(0,0,0,0.58)";

  return (
    <aside style={mobile ? {
      /* ── Mobile : bottom sheet ── */
      position:"fixed", left:0, right:0, bottom:0,
      height: isOpen ? "62vh" : "0px",
      width:"100%",
      zIndex:40,
      background: bg,
      boxShadow: isOpen ? "0 -24px 70px -10px rgba(0,0,0,0.5)" : "none",
      borderRadius:"30px 30px 0 0",
      backdropFilter:"none",
      WebkitBackdropFilter:"none",
      transition:"height 280ms cubic-bezier(0.22,1,0.36,1)",
      color: text,
      overflow:"visible",
      fontFamily:"var(--font-ui)",
      display:"flex", flexDirection:"column",
      paddingBottom:"env(safe-area-inset-bottom)",
    } : {
      /* ── Desktop : sidebar droite ── */
      position:"fixed", top:18, right:18, bottom:18,
      width:"min(340px, calc(100vw - 36px))",
      zIndex:40,
      background: bg,
      boxShadow: isOpen ? "0 40px 80px -12px rgba(0,0,0,0.55), 0 10px 22px rgba(0,0,0,0.28)" : "none",
      transformOrigin:"100% 50%",
      transform: isOpen ? "perspective(1600px) rotateY(0deg)" : "perspective(1600px) translateX(40px) rotateY(-78deg)",
      opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none",
      transition:"transform 520ms cubic-bezier(0.22,1,0.36,1), opacity 260ms ease, box-shadow 300ms ease",
      color: text,
      overflow:"hidden",
      borderRadius:0,
      fontFamily:"var(--font-ui)",
      display:"flex", flexDirection:"column",
    }}>
      {work ? (
        <div key={mobile ? "sheet" : work.id} style={{ display:"flex", flexDirection:"column", flex:1, minHeight:0,
          position:"relative", transformOrigin:"100% 50%",
          animation: mobile ? "none" : "cardTurn 460ms cubic-bezier(0.22,1,0.36,1) both" }}>
          {/* Héros : la pochette, puis le titre */}
          <button onClick={onClose} aria-label={lang === "fr" ? "Fermer" : "Close"} style={{
            position:"absolute", top: mobile ? 16 : 10, right: mobile ? 18 : 10, zIndex:2, width:30, height:30,
            background:"rgba(0,0,0,0.55)", border:"none", color:"#ffffff",
            fontSize:13, cursor:"pointer", borderRadius: mobile ? "50%" : 0, fontFamily:"var(--font-ui)",
          }}>✕</button>
          {!mobile && tab === "fiche" && <Cover work={work} url={coverUrl} tint={tint} />}
          {mobile && (
            <div aria-hidden="true" style={{ position:"absolute", left:"50%", bottom:"calc(100% + 22px)",
              width:"min(210px, 27vh)", marginLeft:"calc(min(210px, 27vh) / -2)",
              transform:"perspective(900px) rotateY(-14deg) rotateX(4deg)",
              boxShadow:"28px -4px 44px -10px rgba(0,0,0,0.5)", pointerEvents:"none" }}>
              <Cover work={work} url={coverUrl} tint={tint} />
            </div>
          )}
          <div style={{ padding: mobile ? "26px 24px 0" : "18px 18px 0", flexShrink:0,
            display:"flex", gap:12, alignItems:"center" }}>
            {!mobile && tab !== "fiche" && <Cover work={work} url={coverUrl} tint={tint} size={64} />}
            <div style={{ minWidth:0, paddingRight: (mobile || tab !== "fiche") ? 34 : 0 }}>
              <h2 style={{ margin:0, fontSize: mobile ? 30 : 26, lineHeight:1.02, fontWeight:700,
                letterSpacing:"-0.03em", color: text }}>
                {work.title}
              </h2>
              <div style={{ marginTop:6, fontSize:14, color: muted }}>
                {work.artist}{work.year ? ` · ${work.year}` : ""}
              </div>
            </div>
          </div>

          {/* Onglets */}
          <div style={{ padding: mobile ? "12px 24px 0" : "12px 16px 0", flexShrink:0 }}>
            <Tabs tab={tab} lang={lang} onChange={t => {
              onTabChange(t);
              if (t === "autour")      onExploreAround?.();
              if (t === "trajectoire") onShowTrajectory?.();
            }} dark={dark} />
          </div>

          {/* Contenu scrollable */}
          <div style={{ flex:1, overflowY:"auto", padding: mobile ? "0 24px 20px" : "0 16px 20px" }}>
            {tab === "fiche" && (
              <FicheTab
                work={work} dark={dark} lang={lang} mobile={mobile} activeMode={activeMode}
                onExploreAround={() => { onTabChange("autour"); onExploreAround?.(); }}
                onShowTrajectory={() => { onTabChange("trajectoire"); onShowTrajectory?.(); }}
                onStartVoyage={onStartVoyage}
                voyageMode={voyageMode}
                onRequestAnalysis={onRequestAnalysis}
                onRequestDiscuss={onRequestDiscuss}
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
              />
            )}
            {tab === "autour" && (
              <AutourTab works={nearbyWorks} dark={dark} lang={lang} onSelectWork={onSelectWork} />
            )}
            {tab === "trajectoire" && (
              <TrajectoireTab works={trajectoryWorks} dark={dark} lang={lang} onSelectWork={onSelectWork} />
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding:"28px 18px", flex:1, display:"flex", alignItems:"center" }}>
          <div style={{ fontSize:14, color: muted, lineHeight:1.65 }}>
            {P.emptyHint}
          </div>
        </div>
      )}
    </aside>
  );
}
