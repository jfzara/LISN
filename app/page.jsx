"use client";
import { contrastOn } from "../lib/lisn/tint";
import { useCover } from "../lib/lisn/useCover";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
import GlobeScene    from "@/components/globe/GlobeScene";
import WorkPanel     from "@/components/globe/WorkPanel";
import SearchBar     from "@/components/globe/SearchBar";
import ComparePanel, { computeDistance, distanceLabel } from "@/components/globe/ComparePanel";
import AnalysisModal from "@/components/globe/AnalysisModal";
import DiscussModal  from "@/components/globe/DiscussModal";
import { worksSeed } from "@/data/worksSeed";
import GestureHint from "@/components/globe/GestureHint";
import HelpPanel   from "@/components/globe/HelpPanel";

// ── Thème ──────────────────────────────────────────────────────────
const ACCENT = "#8c8c8c";   // rouge signal — réservé à l'œuvre choisie et à l'action principale
const THEME = {
  // Au repos : fond blanc, globe noir, points blancs. Le fond prend ensuite la couleur de l'œuvre.
  dark: {
    bg:"#ffffff", text:"#ffffff", muted:"rgba(255,255,255,0.68)",
    border:"rgba(255,255,255,0.3)", navBg:"#000000", cardBg:"#000000",
    pill:"rgba(255,255,255,0.16)", track:"rgba(255,255,255,0.14)",
  },
  // Inversé : fond noir, globe blanc, points noirs
  light: {
    bg:"#000000", text:"#000000", muted:"rgba(0,0,0,0.58)",
    border:"rgba(0,0,0,0.22)", navBg:"#ffffff", cardBg:"#ffffff",
    pill:"rgba(0,0,0,0.08)", track:"rgba(0,0,0,0.1)",
  },
};

const BIOME_META = {
  all:         { fr: "Tout",    en: "All",    color: null },
  dense:       { fr: "Dense",   en: "Dense",  color: "#8c8c8c" },
  atmospheric: { fr: "Atmosphérique", en: "Atmospheric",  color: "#ffffff" },
  structural:  { fr: "Structurel", en: "Structural", color: "#ffffff" },
  narrative:   { fr: "Récit",   en: "Story",  color: "#ffffff" },
  hybrid:      { fr: "Hybride", en: "Hybrid", color: "#ffffff" },
};

// Textes UI bilingues — tout ici, rien en dur ailleurs
const UI = {
  fr: {
    modeLabels: { compare:"en comparaison", voyage:"en voyage", mountains:"les sommets", frontier:"ailleurs", globe:"tout" },
    nav: { random:"◎", voyage:"▷", voyageStop:"◼", compare:"⊕", reset:"↺", filters:"≡", guide:"Guide", lang:"EN" },
    navLabels: { random:"Surprise", voyage:"Voyage", filters:"Filtres", compare:"Comparer", theme:"Thème", guide:"Guide" },
    themeLabel: () => "Inverser",
    voyageIndicator: "En voyage",
    filterTitle: "Zone",
    filterScore: (min, max) => `Intensité — ${min.toFixed(1)} → ${max.toFixed(1)}`,
    filterEra: "Époque",
    filterSearch: "Recherche",
    filterReset: "Réinitialiser",
    filterRole: "Rôle",
    roles: { all:"Tous", capital:"Capitales", city:"Villes", village:"Villages", hamlet:"Hameaux", bridge:"Ponts", satellite:"Satellites" },
    onboarding: {
      tagline: "Une carte des formes musicales. Je te fais visiter ?",
      choices: [
        { key:"random",    icon:"◉", label:"Surprends-moi",                 desc:"Je choisis. Fais-moi confiance." },
        { key:"mountains", icon:"△", label:"Les sommets",                   desc:"Ce qui tient debout. Structurellement." },
        { key:"frontier",  icon:"◇", label:"Ailleurs",                      desc:"Loin de tes habitudes. C'est un peu le but." },
        { key:"free",      icon:"○", label:"Je sais ce que je cherche",     desc:"Parfait. La carte est à toi." },
      ],
      helpLink: "Comment ça marche ? →",
      skip: "Passer →",
    },
    hover: { year: "" },
    compare: { instruction1: "Choisis une première œuvre", instruction2: "Et maintenant, son adversaire" },
    workPanel: { exploreAround:"Explorer autour", trajectory:"Trajectoire de l'artiste", voyage:"Voyager depuis ici", voyageStop:"Arrêter le voyage", analyse:"Analyser dans LISN →", tabFiche:"Fiche", tabAround:"Autour", tabTrajectory:"Trajectoire", emptyHint:"Survole un point.\nClique si ça t'intrigue.", autourEmpty:"Clique l'onglet Autour sur la fiche pour voir les œuvres proches.", trajectoryEmpty:"Clique l'onglet Trajectoire pour voir l'évolution de l'artiste." },
    roles: { capital:"Capitales", city:"Villes", village:"Villages", bridge:"Ponts", island:"Îles", hamlet:"Hameaux" },
    entityTypes: { album:"Album", artist:"Artiste", track:"Morceau" },
    biomeLabels: { dense:"Dense", atmospheric:"Atmosphérique", structural:"Structurel", narrative:"Narratif", hybrid:"Hybride" },
    scoreLabel: "Score OSR",
    roleLabel: "Rôle",
    biomeLabel: "Zone",
    typeLabel: "Type",
    yearLabel: "Année",
    analysisModal: { badge:"Analyse LISN · Aperçu", scoreLabel:"Score OSR estimé", structureLabel:"Aperçu structurel", noticeHead:"Le verdict LISN complet", noticeBody:"L'analyse complète — verdict éditorial, scores dimensionnels, worldview — sera disponible dès que cette œuvre sera analysée.", noticeNote:"Ces données sont des estimations." },
    comparePanel: { title:"Comparaison structurale", slotA:"A", slotB:"B", distLabel:"Distance structurale", instruction1:"Clique deux œuvres sur le globe pour les comparer.", instruction2:"Clique une deuxième œuvre pour comparer.", levels: { veryClose:"Très proches", close:"Proches", far:"Éloignées", veryFar:"Très éloignées", opposite:"Mondes opposés" } },
    audio: { loading:"Recherche sur YouTube…", notFound:"Non trouvé", reduce:"▾ Réduire", listen:"▸ Écouter", listenYT:"▸ Écouter sur YouTube" },
    gestureHints: [{ icon:"pinch", label:"Pince pour zoomer" }, { icon:"rotate", label:"Glisse pour tourner" }],
  },
  en: {
    modeLabels: { compare:"comparing", voyage:"on a journey", mountains:"the peaks", frontier:"elsewhere", globe:"everything" },
    nav: { random:"◎", voyage:"▷", voyageStop:"◼", compare:"⊕", reset:"↺", filters:"≡", guide:"Guide", lang:"FR" },
    navLabels: { random:"Surprise", voyage:"Journey", filters:"Filters", compare:"Compare", theme:"Theme", guide:"Guide" },
    themeLabel: () => "Invert",
    voyageIndicator: "Voyaging",
    filterTitle: "Zone",
    filterScore: (min, max) => `Intensity — ${min.toFixed(1)} → ${max.toFixed(1)}`,
    filterEra: "Era",
    filterSearch: "Search",
    filterReset: "Reset",
    filterRole: "Role",
    roles: { all:"All", capital:"Capitals", city:"Cities", village:"Villages", hamlet:"Hamlets", bridge:"Bridges", satellite:"Satellites" },
    onboarding: {
      tagline: "A map of musical forms. Shall I show you around?",
      choices: [
        { key:"random",    icon:"◉", label:"Surprise me",                       desc:"I pick. Trust me." },
        { key:"mountains", icon:"△", label:"The peaks",                         desc:"What holds up. Structurally." },
        { key:"frontier",  icon:"◇", label:"Elsewhere",                         desc:"Far from your habits. That's rather the point." },
        { key:"free",      icon:"○", label:"I know what I'm after",             desc:"Good. The map is yours." },
      ],
      helpLink: "How does this work? →",
    },
    hover: { year: "" },
    compare: { instruction1: "Click a first work on the globe", instruction2: "Click a second work to compare" },
    workPanel: { exploreAround:"Explore around", trajectory:"Artist trajectory", voyage:"Voyage from here", voyageStop:"Stop voyage", analyse:"Analyse in LISN →", tabFiche:"Info", tabAround:"Around", tabTrajectory:"Trajectory", emptyHint:"Hover a luminous point,\nclick to open its card.", autourEmpty:"Click the Around tab on the card to see nearby works.", trajectoryEmpty:"Click the Trajectory tab to see the artist's evolution." },
    roles: { capital:"Capital — landmark work", city:"City — major work", village:"Village — solid work", bridge:"Bridge — transitional work", island:"Island — singular, isolated work", hamlet:"Hamlet — minor or niche work" },
    entityTypes: { album:"Album", artist:"Artist", track:"Track" },
    biomeLabels: { dense:"Dense", atmospheric:"Atmospheric", structural:"Structural", narrative:"Narrative", hybrid:"Hybrid" },
    scoreLabel: "OSR Score",
    roleLabel: "Role",
    biomeLabel: "Zone",
    typeLabel: "Type",
    yearLabel: "Year",
    analysisModal: { badge:"LISN Analysis · Preview", scoreLabel:"Estimated OSR score", structureLabel:"Structural preview", noticeHead:"Full LISN verdict", noticeBody:"The complete analysis — editorial verdict, dimensional scores, worldview — will be available once this work has been fully analysed.", noticeNote:"Current data are estimates." },
    comparePanel: { title:"Structural comparison", slotA:"A", slotB:"B", distLabel:"Structural distance", instruction1:"Click two works on the globe to compare.", instruction2:"Click a second work to compare.", levels: { veryClose:"Very close", close:"Close", far:"Distant", veryFar:"Very distant", opposite:"Opposite worlds" } },
    audio: { loading:"Searching YouTube…", notFound:"Not found", reduce:"▾ Collapse", listen:"▸ Listen", listenYT:"▸ Listen on YouTube" },
    gestureHints: [{ icon:"pinch", label:"Pinch to zoom" }, { icon:"rotate", label:"Swipe to rotate" }],
  },
};

// Décennies disponibles dans le seed
const DECADES = [null, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

// Niveaux en mots — remplacent les sliders min/max
const LEVELS = [
  { key:"all",   min:2,   max:10, fr:"Tout",          en:"Everything" },
  { key:"best",  min:8,   max:10, fr:"Le meilleur",   en:"The best" },
  { key:"peaks", min:9,   max:10, fr:"Les sommets",   en:"The peaks" },
];
const decadeLabel = (d, lang) => !d
  ? (lang === "fr" ? "Toutes" : "Any time")
  : (lang === "fr" ? `Années ${d >= 2000 ? d : String(d).slice(2)}` : `${d}s`);

function LevelChips({ scoreMin, scoreMax, setScoreMin, setScoreMax, T, lang, chip }) {
  return LEVELS.map(lv => {
    const active = scoreMin === lv.min && scoreMax === lv.max;
    return (
      <button key={lv.key} style={chip(active)}
        onClick={() => { setScoreMin(lv.min); setScoreMax(lv.max); }}>
        {lv[lang] || lv.fr}
      </button>
    );
  });
}

function applyFilters(works, { biome, scoreMin, scoreMax, decade, role = "all" }) {
  return works.filter(w => {
    if (biome !== "all" && (w.biome || w.regime) !== biome) return false;
    const s = w.score || 0;
    if (s < scoreMin || s > scoreMax) return false;
    if (decade) {
      const y = w.year;
      if (!y) return false;
      if (y < decade || y >= decade + 10) return false;
    }
    if (role !== "all" && w.role !== role) return false;
    return true;
  });
}

// ── Slider ──────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 0.5, onChange, T, fmt }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:100 }}>
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:11, letterSpacing:"0.005em", textTransform:"none",
          color: T.muted, fontFamily:"var(--font-ui)" }}>{label}</span>
        <span style={{ fontSize:11, color: T.muted, fontFamily:"var(--font-ui)" }}>
          {fmt ? fmt(value) : value}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width:"100%", height:2, cursor:"pointer", accentColor: T.text, opacity:0.7 }} />
    </div>
  );
}

// ── VoyagePanel — contrôles voyage enrichis (B+C) ───────────────────
function VoyagePanel({ work, dark, T, lang, isFav, onToggleFav, onNext, onPrev, hasPrev = false, onStop, autoPlayEnabled = false, mobile = false }) {
  const biomeColor = {
    dense:"#8c8c8c", atmospheric:"#8c8c8c", structural:"#8c8c8c",
    narrative:"#8c8c8c", hybrid:"#8c8c8c",
  }[work?.biome || work?.regime] || T.text;

  // C. Auto-play YouTube — iframe caché qui joue dès que l'œuvre change
  const [videoId,       setVideoId]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [showFullPlayer,setShowFullPlayer] = useState(false);
  const prevWorkId = useRef(null);

  useEffect(() => {
    // Ne pas fetch si autoplay pas encore autorisé (intro pas terminée)
    if (!work || !autoPlayEnabled) return;
    if (work.id === prevWorkId.current) return;
    prevWorkId.current = work.id;
    setVideoId(null);
    setLoading(true);
    setShowFullPlayer(false); // replier le player à chaque nouvelle œuvre
    // Petit délai pour laisser l'animation de transition se faire
    const t = setTimeout(() => {
      fetch(`/api/youtube-preview?artist=${encodeURIComponent(work.artist)}&title=${encodeURIComponent(work.title)}`)
        .then(r => r.json())
        .then(d => { if (d.videoId) setVideoId(d.videoId); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 800);
    return () => clearTimeout(t);
  }, [work?.id, autoPlayEnabled]);

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&start=20`
    : null;

  return (
    <div style={mobile ? {
      /* Mobile — bottom sheet au-dessus de la nav, zone pouce */
      position:"fixed", left:0, right:0, bottom:64,
      zIndex:50,
      background: T.cardBg,
      borderTop:`2px solid ${biomeColor}`,
      backdropFilter:"none",
      WebkitBackdropFilter:"none",
      overflow:"hidden",
      fontFamily:"var(--font-ui)",
      maxHeight:"42vh",
      overflowY:"auto",
    } : {
      /* Desktop — coin supérieur droit ; la fiche est masquée pendant le voyage */
      position:"fixed", top:18, right:20,
      zIndex:50,
      width:"min(320px, calc(100vw - 40px))",
      background: T.cardBg,
      border:`1px solid ${biomeColor}`,
      borderRadius:0,
      backdropFilter:"none",
      WebkitBackdropFilter:"none",
      overflow:"hidden",
      fontFamily:"var(--font-ui)",
    }}>
      {/* Bande couleur biome */}
      <div style={{ height:2, background: biomeColor }} />

      {/* Header — titre + artiste */}
      <div style={{ padding:"12px 14px 10px",
        display:"flex", alignItems:"flex-start", gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11, color:T.muted, letterSpacing:"0.005em",
            textTransform:"none", fontFamily:"var(--font-ui)", marginBottom:4 }}>
            {lang === "fr" ? "En voyage" : "On a journey"}
            {loading && <span style={{ marginLeft:6, opacity:0.5 }}>·</span>}
          </div>
          <div style={{ fontSize:15, fontStyle:"normal", color:T.text,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            lineHeight:1.2 }}>
            {work.title}
          </div>
          <div style={{ fontSize:12, color:T.muted, marginTop:3 }}>
            {work.artist}
            {work.year && <span style={{ marginLeft:6, opacity:0.5 }}>{work.year}</span>}
          </div>
        </div>
        {/* Score */}
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontSize:16, color:biomeColor,
            fontFamily:"var(--font-ui)", fontWeight:500 }}>
            {Number(work.score||0).toFixed(1)}
          </div>
          <div style={{ fontSize:11, color:T.muted,
            fontFamily:"var(--font-ui)" }}>/10</div>
        </div>
      </div>

      {/* Player YouTube — iframe caché, audio uniquement visible */}
      {embedUrl && (
        <div style={{ position:"relative", height:0, overflow:"hidden" }}>
          <iframe
            key={videoId}
            src={embedUrl}
            width="1" height="1"
            style={{ position:"absolute", opacity:0, pointerEvents:"none" }}
            allow="autoplay; encrypted-media"
          />
        </div>
      )}

      {/* Barre de progression visuelle — pulse pendant le voyage */}
      <div style={{ height:1, background:T.track, position:"relative", marginBottom:0 }}>
        <div style={{
          position:"absolute", left:0, top:0, height:"100%",
          background: biomeColor, opacity:0.6,
          animation:"voyageProgress 6s linear",
          width:"100%",
        }} key={work.id} />
      </div>

      {/* Contrôles */}
      <div style={{ padding:"10px 14px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>

        {/* ♥ Sauvegarder */}
        <button onClick={onToggleFav} style={{
          background:"none", border:`1px solid ${isFav ? biomeColor : T.border}`,
          borderRadius:0, padding:"6px 10px", cursor:"pointer",
          color: isFav ? biomeColor : T.muted,
          fontSize:14, display:"flex", alignItems:"center", gap:5,
          fontFamily:"var(--font-ui)", letterSpacing:"0.005em",
          transition:"all 0.15s",
        }}>
          {isFav ? "♥" : "♡"}
          <span style={{ fontSize:11, textTransform:"none" }}>
            {lang === "fr" ? (isFav ? "Sauvé" : "Sauver") : (isFav ? "Saved" : "Save")}
          </span>
        </button>

        {/* Boutons navigation */}
        <div style={{ display:"flex", gap:6 }}>
          {/* → Suivant */}
          <button onClick={onNext} style={{
            background:"none",
            borderWidth:1, borderStyle:"solid", borderColor: T.border,
            borderRadius:0, padding:"6px 12px", cursor:"pointer",
            color:T.text, fontSize:13,
            display:"flex", alignItems:"center", gap:4,
            fontFamily:"var(--font-ui)",
            transition:"border-color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.text}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >
            <span style={{ fontSize:11, textTransform:"none", letterSpacing:"0.005em",
              color:T.muted }}>
              {lang === "fr" ? "Suivant" : "Next"}
            </span>
            <span>→</span>
          </button>

          {/* ◼ Stop */}
          <button onClick={onStop} style={{
            background:T.pill, border:"none",
            borderRadius:0, padding:"6px 10px", cursor:"pointer",
            color:T.muted, fontSize:12,
            fontFamily:"var(--font-ui)", letterSpacing:"0.005em",
            textTransform:"none",
          }}>
            ◼
          </button>
        </div>
      </div>

      {/* Player YouTube inline — reste dans l'app */}
      {videoId && showFullPlayer && (
        <div style={{ margin:"0 14px 10px", borderRadius:0, overflow:"hidden",
          border:"none", background:T.pill, aspectRatio:"16/9", position:"relative" }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&start=20`}
            width="100%" height="100%"
            style={{ display:"block", position:"absolute", inset:0, border:"none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media"
            allowFullScreen loading="lazy"
          />
        </div>
      )}
      {videoId && (
        <div style={{ padding:"0 14px 10px" }}>
          <button onClick={() => setShowFullPlayer(v => !v)} style={{
            background:"none", border:"none", cursor:"pointer",
            fontSize:11, color:T.muted, opacity:0.6,
            fontFamily:"var(--font-ui)", letterSpacing:"0.005em",
            textTransform:"none", padding:0,
          }}>
            {showFullPlayer
              ? (lang === "fr" ? "▾ Masquer la vidéo" : "▾ Hide video")
              : (lang === "fr" ? "▸ Voir la vidéo" : "▸ Watch video")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── FavoritesPanel — liste des œuvres sauvegardées ────────────────
function FavoritesPanel({ favorites, dark, T, lang, onSelect, onRemove, onClose }) {
  const fav = Object.values(favorites).sort((a,b) => (b.savedAt||0) - (a.savedAt||0));
  const BIOME_COLOR = {
    dense:"#8c8c8c", atmospheric:"#8c8c8c", structural:"#8c8c8c",
    narrative:"#8c8c8c", hybrid:"#8c8c8c",
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:100,
      background: T.cardBg, overflowY:"auto",
      fontFamily:"var(--font-ui)",
      color:T.text,
    }}>
      {/* Header */}
      <div style={{
        position:"sticky", top:0, zIndex:10,
        padding:"16px 20px",
        borderBottom:`2px dotted ${T.border}`,
        background: T.cardBg,
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <div>
          <div style={{ fontSize:17, fontStyle:"normal", letterSpacing:"-0.02em" }}>
            {lang === "fr" ? "Mes favoris" : "My favorites"}
          </div>
          <div style={{ fontSize:11, color:T.muted, fontFamily:"var(--font-ui)",
            letterSpacing:"0.005em", textTransform:"none", marginTop:3 }}>
            {fav.length} {lang === "fr" ? "œuvre" : "work"}{fav.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button onClick={onClose} style={{
          background:T.pill, border:"none", color:T.muted,
          fontSize:11, padding:"5px 10px", cursor:"pointer", borderRadius:0,
          fontFamily:"var(--font-ui)", letterSpacing:"0.005em",
        }}>
          {lang === "fr" ? "Fermer" : "Close"}
        </button>
      </div>

      {/* Liste */}
      <div style={{ padding:"16px 20px", maxWidth:520, margin:"0 auto" }}>
        {fav.length === 0 ? (
          <div style={{ fontSize:14, color:T.muted, lineHeight:1.75,
            fontStyle:"normal", marginTop:20 }}>
            {lang === "fr"
              ? "Aucun favori pour l'instant. Appuie sur « Sauvegarder » pendant un voyage pour garder une œuvre."
              : "No favorites yet. Press ♥ during a voyage to save a work."}
          </div>
        ) : (
          fav.map(w => (
            <div key={w.id} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"10px 0",
              borderBottom:`2px dotted ${T.border}`,
            }}>
              <span style={{ width:7, height:7, borderRadius:"50%", flexShrink:0,
                background: BIOME_COLOR[w.biome] || T.muted }} />
              <div style={{ flex:1, minWidth:0, cursor:"pointer" }}
                onClick={() => { onSelect(w); onClose(); }}>
                <div style={{ fontSize:14, fontStyle:"normal", color:T.text,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {w.title}
                </div>
                <div style={{ fontSize:12, color:T.muted, marginTop:2,
                  fontFamily:"var(--font-ui)", letterSpacing:"0.005em" }}>
                  {w.artist}
                  {w.year && <span style={{ marginLeft:6, opacity:0.6 }}>{w.year}</span>}
                </div>
              </div>
              <span style={{ fontSize:12, color:T.muted,
                fontFamily:"var(--font-ui)", flexShrink:0 }}>
                {Number(w.score||0).toFixed(1)}
              </span>
              <button onClick={() => onRemove(w)} style={{
                background:"none", border:"none", cursor:"pointer",
                color:T.muted, fontSize:13, padding:"0 4px", opacity:0.5,
              }}>×</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Onboarding ──────────────────────────────────────────────────────────
function Onboarding({ dark, onChoose, onShowHelp, lang = "fr" }) {
  const T  = dark ? THEME.dark : THEME.light;
  const L  = UI[lang] || UI.fr;
  const bg = dark ? "#000000" : "#ffffff";

  const choices = L.onboarding.choices;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:100,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      background: bg, fontFamily:"var(--font-ui)",
    }}>
      <div style={{ marginBottom:44, textAlign:"center" }}>
        <div style={{ fontSize:88, fontWeight:800, letterSpacing:"-0.045em",
          color: T.text, lineHeight:0.9 }}>lisn</div>
        <div style={{ fontSize:15, color: T.muted, marginTop:14 }}>
          {L.onboarding.tagline}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, width:"min(380px,88vw)" }}>
        {choices.map(c => (
          <button key={c.key} onClick={() => onChoose(c.key)} style={{
            background:T.pill, border:"none", borderRadius:0,
            padding:"15px 18px", cursor:"pointer", textAlign:"left",
            display:"flex", alignItems:"center", gap:14, color: T.text,
            transition:"border-color 0.15s, background 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.text; e.currentTarget.style.background=T.pill; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background="none"; }}
          >
            <div>
              <div style={{ fontSize:16, fontWeight:600, letterSpacing:"-0.01em" }}>{c.label}</div>
              <div style={{ fontSize:13, color: T.muted, marginTop:3,
                fontFamily:"var(--font-ui)", letterSpacing:"0.005em" }}>{c.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <div style={{ marginTop:32, display:"flex", flexDirection:"column",
        alignItems:"center", gap:10 }}>
        <button onClick={() => { onChoose("free"); onShowHelp?.(); }}
          style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:13, color:T.muted, fontFamily:"var(--font-ui)" }}>
          {L.onboarding.helpLink}
        </button>

      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────────────────────────
// Lire la langue initiale de façon synchrone pour éviter le flash FR→EN à l'onboarding
function getInitialLang() {
  if (typeof window === "undefined") return "fr";
  const saved = localStorage.getItem("lisn-lang");
  if (saved) return saved === "en" ? "en" : "fr";
  const browser = (navigator.language || "fr").toLowerCase();
  return browser.startsWith("fr") ? "fr" : "en";
}

export default function HomePage() {
  const [dark, setDark] = useState(true);
  const [mobile,   setMobile]   = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [globeZoom,    setGlobeZoom]    = useState(0.5); // 0=serré 1=lointain

  // Lancer idle hint 8s après la fin de l'intro
  useEffect(() => {
    if (!introComplete) return;
    const t = setTimeout(() => setShowIdleHint(true), 8000);
    return () => clearTimeout(t);
  }, [introComplete]);
  const [showFilters,     setShowFilters]     = useState(false);
  const [showHelp,        setShowHelp]        = useState(false);
  const [showLegend,      setShowLegend]      = useState(true);
  const [lang, setLang] = useState(getInitialLang);  // lazy init — lit localStorage synchro
  const [showOnboarding,  setShowOnboarding]  = useState(false);
  const [selectedWork,    setSelectedWork]    = useState(null);
  const [hoveredWork,     setHoveredWork]     = useState(null);
  const [trail,           setTrail]           = useState(null);
  const [draw,            setDraw]            = useState(null);   // tirage en cours : { title, artist, k, last }
  const drawTimers = useRef([]);
  const cancelDraw = () => { drawTimers.current.forEach(clearTimeout); drawTimers.current = []; setDraw(null); setTrail(null); };
  const lastWorkRef = useRef(null);
  const poolRef = useRef(worksSeed);   // œuvres qui passent les filtres, lisible depuis les minuteries
  useEffect(() => { if (selectedWork) lastWorkRef.current = selectedWork; }, [selectedWork]);
  const [biomeFilter,     setBiomeFilter]     = useState("all");
  const [scoreMin,        setScoreMin]        = useState(2);
  const [scoreMax,        setScoreMax]        = useState(10);
  const [decade,          setDecade]          = useState(null); // null = toutes
  const [roleFilter,      setRoleFilter]      = useState("all");
  const [panelTab,        setPanelTab]        = useState("fiche");
  const [nearbyWorks,     setNearbyWorks]     = useState([]);
  const [trajectoryWorks, setTrajectoryWorks] = useState([]);

  // Favoris — persistés en localStorage
  const [favorites,  setFavorites]  = useState(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("lisn-favorites") || "{}"); }
    catch { return {}; }
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [activeMode,    setActiveMode]    = useState("free"); // "random"|"mountains"|"frontier"|"free"

  // Modes spéciaux
  const [voyageMode,    setVoyageMode]    = useState(false);
  const [voyageCurrent, setVoyageCurrent] = useState(null);
  const [compareMode,   setCompareMode]   = useState(false);
  const [compareA,      setCompareA]      = useState(null);
  const [compareB,      setCompareB]      = useState(null);
  const voyageTimer  = useRef(null);
  const [voyageHistory, setVoyageHistory] = useState([]); // historique pour "précédent"
  const idleHintTimer = useRef(null);
  const [showIdleHint, setShowIdleHint] = useState(false);
  const [analysisWork, setAnalysisWork] = useState(null);
  const [discussWork,  setDiscussWork]  = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("lisn-theme");
    if (saved === "light") setDark(false);
    const savedLang = localStorage.getItem("lisn-lang");
    if (savedLang) {
      // Préférence explicite sauvegardée
      setLang(savedLang === "en" ? "en" : "fr");
    } else {
      // Première visite — détecter depuis le navigateur
      const browserLang = navigator.language || navigator.userLanguage || "fr";
      const detected = browserLang.toLowerCase().startsWith("fr") ? "fr" : "en";
      setLang(detected);
    }
    // lang chargé via useState lazy init
    setMounted(true);
    setMobile(window.innerWidth < 768);
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    // Onboarding — s'affiche 3s à chaque ouverture, disparaît automatiquement
    setShowOnboarding(true);
    const onboardingTimer = setTimeout(() => setShowOnboarding(false), 3000);
    // Idle hint — après 8s sans interaction
    // idle hint lancé après intro via introComplete
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(onboardingTimer);
      clearTimeout(idleHintTimer.current);
    };
  }, []);

  function toggleDark() {
    setDark(v => { localStorage.setItem("lisn-theme", v ? "light" : "dark"); return !v; });
  }

  function toggleLang() {
    setLang(v => {
      const next = v === "fr" ? "en" : "fr";
      localStorage.setItem("lisn-lang", next);
      return next;
    });
  }

  // ── Onboarding ─────────────────────────────────────────────────
  function handleOnboardingChoice(key) {
    setShowOnboarding(false);
    exitCompare(); stopVoyage(); closeTransient();
    setActiveMode(key);

    if (key === "random") {
      setTimeout(() => startVoyage(), 500);

    } else if (key === "mountains") {
      setScoreMin(9); setScoreMax(10);
      const capitals = worksSeed.filter(w => (w.role === "capital" || w.score >= 9.0));
      if (capitals.length) {
        const pick = capitals[Math.floor(Math.random() * capitals.length)];
        setTimeout(() => { setSelectedWork(pick); setPanelTab("fiche"); }, 600);
      }

    } else if (key === "frontier") {
      const isolated = worksSeed.filter(w =>
        w.role === "island" || w.biome === "atmospheric" || w.score < 5.5
      );
      const pool = isolated.length > 10 ? isolated : worksSeed;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setTimeout(() => startVoyage(pick), 500);

    } else {
      // free — reset filters
      setScoreMin(2); setScoreMax(10);
    }
  }

  // ── Une seule chose à la fois ────────────────────────────────────
  // Chaque fonction referme ce que les autres ont ouvert : l'utilisateur
  // n'a jamais à fermer un panneau pour passer à autre chose.
  function closeTransient() { setShowFilters(false); setShowFavorites(false); setShowHelp(false); }
  function exitCompare()    { setCompareMode(false); setCompareA(null); setCompareB(null); }

  function surprise() {
    exitCompare(); stopVoyage(); closeTransient();
    const from = lastWorkRef.current;
    const pool = filteredWorks.filter(w => w.id !== selectedWork?.id);
    const work = pool[Math.floor(Math.random() * pool.length)];
    if (!work) return;
    drawTimers.current.forEach(clearTimeout); drawTimers.current = [];
    const later = (fn, ms) => drawTimers.current.push(setTimeout(fn, ms));
    setHoveredWork(null); setNearbyWorks([]); setTrajectoryWorks([]); setPanelTab("fiche");
    const reveal = () => {
      setDraw(null); setSelectedWork(work);
      setTrail({ from: from && from.id !== work.id ? from : null, to: work, key: Date.now() });
      later(() => setTrail(null), 4600);
    };
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { reveal(); return; }
    // Le tirage : la fiche se referme, des titres défilent en ralentissant, le dernier reste.
    setSelectedWork(null); setTrail(null);
    const others = Array.from({ length: 7 }, () => pool[Math.floor(Math.random() * pool.length)]);
    let t = 0;
    others.forEach((w, i) => { later(() => setDraw({ title: w.title || w.artist, k: i }), t); t += 62 + i * 22; });
    later(() => setDraw({ title: work.title || work.artist, artist: work.title ? work.artist : "", k: 99, last: true }), t);
    later(reveal, t + 620);
  }

  function toggleFilters() {
    setShowFilters(v => !v); setShowFavorites(false); setShowHelp(false);
  }

  // ── Atterrissage aléatoire ──────────────────────────────────────
  function landRandom(pool) {
    const src  = pool || filteredWorks;
    const work = src[Math.floor(Math.random() * src.length)];
    if (work) handleSelect(work);
  }

  // ── Voyage ─────────────────────────────────────────────────────
  const startVoyage = useCallback((fromWork) => {
    cancelDraw();
    setCompareMode(false); setCompareA(null); setCompareB(null);
    setShowFilters(false); setShowFavorites(false); setShowHelp(false);
    setVoyageMode(true);
    setVoyageHistory([]);
    const src = poolRef.current.length ? poolRef.current : worksSeed;
    const start = fromWork || src[Math.floor(Math.random() * src.length)];
    setVoyageCurrent(start);
    setSelectedWork(start); setHoveredWork(null);
    setPanelTab("fiche"); setNearbyWorks([]); setTrajectoryWorks([]);
    scheduleNext(start);
  }, []);

  function scheduleNext(cur, immediate = false) {
    clearTimeout(voyageTimer.current);
    const delay = immediate ? 0 : 6000; // 6s — assez long pour entendre l'intro
    voyageTimer.current = setTimeout(() => {
      const nearby = poolRef.current
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
      setVoyageHistory(h => [...h.slice(-20), pick]); // garder 20 étapes max
      setVoyageCurrent(pick);
      setSelectedWork(pick);
      scheduleNext(pick);
    }, delay);
  }

  function stopVoyage() {
    setVoyageMode(false); setVoyageCurrent(null);
    clearTimeout(voyageTimer.current);
  }

  function toggleFavorite(work) {
    if (!work) return;
    setFavorites(prev => {
      const next = { ...prev };
      if (next[work.id]) delete next[work.id];
      else next[work.id] = { id:work.id, artist:work.artist, title:work.title,
        score:work.score, biome:work.biome, role:work.role, year:work.year,
        savedAt: Date.now() };
      localStorage.setItem("lisn-favorites", JSON.stringify(next));
      return next;
    });
  }

  function isFavorite(work) {
    return work ? Boolean(favorites[work.id]) : false;
  }

  // Voyage — next forcé (skip immédiat)
  function voyageNext() {
    clearTimeout(voyageTimer.current);
    if (voyageCurrent) scheduleNext(voyageCurrent, true);
  }

  // Voyage — précédent (revenir en arrière dans l'historique)
  function voyagePrev() {
    if (voyageHistory.length < 2) return;
    clearTimeout(voyageTimer.current);
    const prev = voyageHistory[voyageHistory.length - 2];
    setVoyageHistory(h => h.slice(0, -1));
    setVoyageCurrent(prev);
    setSelectedWork(prev);
    scheduleNext(prev);
  }
  useEffect(() => () => clearTimeout(voyageTimer.current), []);

  // ── Compare ────────────────────────────────────────────────────
  function toggleCompare() {
    cancelDraw();
    if (compareMode) { exitCompare(); return; }
    // L'œuvre ouverte devient le premier terme de la comparaison
    stopVoyage(); closeTransient();
    setCompareA(selectedWork || null); setCompareB(null);
    setSelectedWork(null); setPanelTab("fiche");
    setCompareMode(true);
  }

  // ── Sélection (gère aussi le mode compare) ────────────────────
  function handleSelect(work) {
    cancelDraw();
    setShowIdleHint(false);
    clearTimeout(idleHintTimer.current);
    if (compareMode) {
      if (!compareA) { setCompareA(work); return; }
      if (!compareB) { if (work.id !== compareA?.id) setCompareB(work); return; }
      // Comparaison terminée : cliquer une autre œuvre en sort et ouvre sa fiche
      exitCompare();
      setSelectedWork(work); setNearbyWorks([]); setTrajectoryWorks([]); setPanelTab("fiche");
      setHoveredWork(null); closeTransient();
      return;
    }
    if (!voyageMode && selectedWork?.id === work?.id) {
      setSelectedWork(null); setPanelTab("fiche");
    } else {
      setSelectedWork(work);
      setNearbyWorks([]); setTrajectoryWorks([]);
      setPanelTab("fiche");
    }
    setHoveredWork(null);
    closeTransient();
  }

  // ── Explorer autour ────────────────────────────────────────────
  function exploreAround(work) {
    if (!work) return;
    const nearby = poolRef.current
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
    applyFilters(worksSeed, { biome: biomeFilter, scoreMin, scoreMax, decade, role: roleFilter }),
  [biomeFilter, scoreMin, scoreMax, decade, roleFilter]);
  poolRef.current = filteredWorks;
  // Le globe montre ce qui passe les filtres, plus les œuvres explicitement en jeu
  // (duel proposé hors filtres, étape de voyage).
  const globeWorks = useMemo(() => {
    const extra = [selectedWork, compareMode && compareA, compareMode && compareB]
      .filter(w => w && !filteredWorks.some(f => f.id === w.id));
    return extra.length ? [...filteredWorks, ...extra] : filteredWorks;
  }, [filteredWorks, selectedWork, compareMode, compareA, compareB]);
  const filtersOn = biomeFilter !== "all" || decade || roleFilter !== "all" || scoreMin > 2 || scoreMax < 10;
  function resetFilters() { setBiomeFilter("all"); setScoreMin(2); setScoreMax(10); setDecade(null); setRoleFilter("all"); }

  // Un filtre qui change écarte la fiche ouverte si son œuvre ne passe plus :
  // rien de ce qui est à l'écran ne contredit les filtres.
  useEffect(() => {
    if (selectedWork && !voyageMode && !filteredWorks.some(w => w.id === selectedWork.id)) {
      setSelectedWork(null); setNearbyWorks([]); setTrajectoryWorks([]); setPanelTab("fiche");
    }
    setNearbyWorks(n => n.filter(w => filteredWorks.some(f => f.id === w.id)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredWorks]);

  // La couleur vient de l'œuvre choisie ; au repos, noir et blanc
  const [tint, setTint] = useState(null);
  const coverUrl = useCover(selectedWork, setTint);
  const T = useMemo(() => {
    const base = dark ? THEME.dark : THEME.light;
    const bg   = (selectedWork && tint) || base.bg;
    const onBg = contrastOn(bg);
    return { ...base, bg, onBg, onBgMuted: onBg === "#000000" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.72)" };
  }, [dark, tint, selectedWork]);
  const L = UI[lang] || UI.fr;

  // La page annonce sa vraie langue (lecteurs d'écran, traduction automatique)
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // Échap referme ce qui est au premier plan, une couche à la fois
  useEffect(() => {
    const onKey = e => {
      if (e.key !== "Escape") return;
      if (analysisWork)      setAnalysisWork(null);
      else if (discussWork)  setDiscussWork(null);
      else if (showHelp)     setShowHelp(false);
      else if (showOnboarding) setShowOnboarding(false);
      else if (showFavorites) setShowFavorites(false);
      else if (showFilters)  setShowFilters(false);
      else if (compareMode)  exitCompare();
      else if (voyageMode)   stopVoyage();
      else if (selectedWork) { setSelectedWork(null); setPanelTab("fiche"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Recommandation du jour — stable sur la journée, choisie parmi les sommets
  const [tonightDismissed, setTonightDismissed] = useState(false);
  const tonight = useMemo(() => {
    if (!mounted) return null;
    const pool = worksSeed.filter(w => (w.score || 0) >= 9);
    if (!pool.length) return null;
    const d = new Date();
    const day = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    return pool[(day * 7 + d.getFullYear()) % pool.length];
  }, [mounted]);

  const modeLabel = compareMode ? L.modeLabels.compare
    : voyageMode ? L.modeLabels.voyage
    : scoreMin > 7.5 ? L.modeLabels.mountains
    : scoreMax < 5 ? L.modeLabels.frontier
    : decade ? `${decade}s`
    : roleFilter !== "all" ? (L.roles[roleFilter] || roleFilter).toLowerCase()
    : biomeFilter !== "all" ? (BIOME_META[biomeFilter]?.[lang] || BIOME_META[biomeFilter]?.fr || "").toLowerCase()
    : L.modeLabels.globe;

  const sep = <div style={{ width:8, flexShrink:0 }} />;

  // Éviter l'hydratation mismatch — ne rendre qu'après le mount côté client
  if (!mounted) {
    return (
      <div style={{ ...S.page, background: "#ffffff" }} />
    );
  }

  return (
    <div style={{ ...S.page, background: T.bg, color: T.text, transition:"background 600ms ease" }}>

      {showOnboarding && <Onboarding dark={dark} lang={lang} onChoose={handleOnboardingChoice} onShowHelp={() => setShowHelp(true)} />}

      {/* Le globe recule et monte quand la balance sort : deux plans, deux mouvements opposés */}
      <div style={{ ...S.stage,
        transform: mobile ? "none"
          : compareMode ? "translateY(-9%) scale(0.86)"
          : selectedWork && !voyageMode ? "translateX(-179px)" : "none",
        transition:"transform 700ms cubic-bezier(.16,1,.3,1)" }}>
        <GlobeScene
          works={globeWorks}
          selectedWork={compareMode ? (compareA || null) : selectedWork}
          hoveredWork={hoveredWork}
          onSelectWork={handleSelect}
          onHoverWork={setHoveredWork}
          activeFilter={biomeFilter}
          dark={dark}
          bg={T.bg}
          compareA={compareMode ? compareA : null} compareB={compareMode ? compareB : null}
          trail={trail} drawing={!!draw}
          nearbyWorks={nearbyWorks}
          trajectoryWorks={trajectoryWorks}
          mobile={mobile}
          onIntroComplete={() => setIntroComplete(true)}
          onZoomChange={setGlobeZoom}
        />
        <div className="lisn-grain" aria-hidden="true" />
      </div>

      {/* ── B+C. Panneau de voyage enrichi ───────────────── */}
      {voyageMode && voyageCurrent && (
        <VoyagePanel
          work={voyageCurrent}
          dark={dark} T={T} lang={lang}
          isFav={isFavorite(voyageCurrent)}
          onToggleFav={() => toggleFavorite(voyageCurrent)}
          onNext={voyageNext}
          onPrev={voyagePrev}
          hasPrev={voyageHistory.length >= 2}
          onStop={stopVoyage}
          autoPlayEnabled={introComplete}
          mobile={mobile}
        />
      )}

      {/* Panel compare */}
      {compareMode && !showFilters && !showFavorites && (
        <ComparePanel
          workA={compareA} workB={compareB}
          onClearA={() => setCompareA(null)}
          onClearB={() => setCompareB(null)}
          onClose={exitCompare}
          onSetA={setCompareA} onSetB={setCompareB} allWorks={worksSeed}
          dark={dark} T={T} lang={lang}
        />
      )}

      {/* ── Nav ──────────────────────────────────────────────── */}
      {mobile ? (
        <>
        {/* ── Drawer filtres mobile ── */}
        {showFilters && (
          <div style={{
            position:"fixed", left:0, right:0, top:0, zIndex:35,
            background: T.navBg, borderTop:"none",
            backdropFilter:"none", padding:"28px 24px 24px",
            maxHeight:"72vh", overflowY:"auto",
            borderRadius:"0 0 30px 30px", boxShadow:"0 24px 70px rgba(0,0,0,0.4)",
          }}>
            {/* Biomes */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, letterSpacing:"0.005em", color:T.muted,
                fontFamily:"var(--font-ui)", textTransform:"none", marginBottom:8 }}>
                {L.filterTitle}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {Object.entries(BIOME_META).map(([key, meta]) => {
                  const active = biomeFilter === key;
                  return (
                    <button key={key} onClick={() => setBiomeFilter(key)} style={{
                      padding:"6px 12px", border:"none",
                      borderRadius:0, background: active ? T.text : "none",
                      color: active ? T.navBg : T.text,
                      fontSize:12, cursor:"pointer",
                      fontFamily:"var(--font-ui)",
                    }}>
                      {meta[lang] || meta.fr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Niveau */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:T.muted, marginBottom:8 }}>
                {lang === "fr" ? "Niveau" : "Level"}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                <LevelChips scoreMin={scoreMin} scoreMax={scoreMax} setScoreMin={setScoreMin} setScoreMax={setScoreMax}
                  T={T} lang={lang} chip={active => ({
                    padding:"6px 10px", border:"none", borderRadius:0,
                    background: active ? T.text : "none", color: active ? T.navBg : T.muted,
                    fontSize:12, cursor:"pointer", fontFamily:"var(--font-ui)" })} />
              </div>
            </div>

            {/* Décennies */}
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:11, letterSpacing:"0.005em", color:T.muted,
                fontFamily:"var(--font-ui)", textTransform:"none", marginBottom:8 }}>
                {L.filterEra}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {DECADES.map(d => {
                  const active = decade === d;
                  return (
                    <button key={d??'all'} onClick={() => setDecade(active ? null : d)} style={{
                      padding:"6px 10px", border:"none",
                      borderRadius:0, background: active ? T.text : "none",
                      color: active ? T.navBg : T.muted,
                      fontSize:12, cursor:"pointer",
                      fontFamily:"var(--font-ui)",
                    }}>
                      {decadeLabel(d, lang)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rôle */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, letterSpacing:"0.005em", color:T.muted,
                fontFamily:"var(--font-ui)", textTransform:"none", marginBottom:8 }}>
                {L.filterRole}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {Object.entries(L.roles).map(([key, label]) => {
                  const active = roleFilter === key;
                  return (
                    <button key={key} onClick={() => setRoleFilter(key)} style={{
                      padding:"6px 12px", border:"none",
                      borderRadius:0, background: active ? T.text : "none",
                      color: active ? T.navBg : T.muted,
                      fontSize:11, cursor:"pointer",
                      fontFamily:"var(--font-ui)",
                    }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recherche */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, letterSpacing:"0.005em", color:T.muted,
                fontFamily:"var(--font-ui)", textTransform:"none", marginBottom:8 }}>
                {L.filterSearch}
              </div>
              <SearchBar dark={dark} T={T} lang={lang} onSelect={w => {
                if (!filteredWorks.some(f => f.id === w.id)) resetFilters();
                handleSelect(w);
                setShowFilters(false);
              }} />
            </div>

            {/* Langue + Thème */}
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              <button onClick={toggleLang} style={{
                flex:1, padding:"10px", border:"none",
                background:T.pill, color:T.text, fontSize:12, cursor:"pointer",
                fontFamily:"var(--font-ui)", letterSpacing:"0.005em",
                borderRadius:0,
              }}>
                {lang === "fr" ? "English" : "Français"}
              </button>
              <button onClick={toggleDark} style={{
                flex:1, padding:"10px", border:"none",
                background:T.pill, color:T.text, fontSize:12, cursor:"pointer",
                fontFamily:"var(--font-ui)", letterSpacing:"0.005em",
                borderRadius:0,
              }}>
                {L.themeLabel(dark)}
              </button>
            </div>

            {/* Reset */}
            <button onClick={() => { setBiomeFilter("all"); setScoreMin(2); setScoreMax(10); setDecade(null); setRoleFilter("all"); setShowFilters(false); }}
              style={{ marginTop:8, width:"100%", padding:"10px", border:"none",
                background:T.pill, color:T.muted, fontSize:12, cursor:"pointer",
                fontFamily:"var(--font-ui)", letterSpacing:"0.005em" }}>
              {L.filterReset}
            </button>
          </div>
        )}

        {/* ── Nav mobile — barre fixe en bas — 7 boutons ── */}
        <nav style={{
          position:"fixed", bottom:0, left:0, right:0, height:64,
          zIndex:40, display:"flex", alignItems:"center",
          justifyContent:"space-around",
          paddingBottom:"env(safe-area-inset-bottom)",
          background: T.navBg, borderTop:"none",
          backdropFilter:"none", WebkitBackdropFilter:"none",
          touchAction:"manipulation",
        }}>

          {/* 1. Home / lisn — retour aux 4 modes */}
          <button style={{ ...S.mobileBtn(T), minWidth:40 }}
            onClick={() => setShowOnboarding(true)}>
            <span style={{ fontSize:19, fontWeight:800, color: T.text,
              fontFamily:"var(--font-ui)", letterSpacing:"-0.04em", lineHeight:1 }}>lisn</span>
          </button>

          {/* 2. Voyage */}
          <button style={S.mobileBtn(T)}
            onClick={() => voyageMode ? stopVoyage() : startVoyage(selectedWork||undefined)}>
            <span style={{ ...S.mobileBtnIcon,
              color: voyageMode ? T.text : T.muted, fontSize:17 }}>
              {voyageMode ? "◼" : "▷"}
            </span>
            <span style={{ ...S.mobileBtnLabel(T), color: voyageMode ? T.text : T.muted }}>
              {L.navLabels.voyage}
            </span>
          </button>

          {/* 3. Filtres */}
          <button style={S.mobileBtn(T)}
            onClick={toggleFilters}>
            <span style={{ ...S.mobileBtnIcon,
              color: showFilters ? T.text : T.muted }}>≡</span>
            <span style={{ ...S.mobileBtnLabel(T),
              color: showFilters ? T.text : T.muted }}>
              {L.navLabels.filters}
            </span>
          </button>

          {/* 4. Comparer */}
          <button style={S.mobileBtn(T)} onClick={toggleCompare}>
            <span style={{ ...S.mobileBtnIcon,
              color: compareMode ? T.text : T.muted }}>⊕</span>
            <span style={{ ...S.mobileBtnLabel(T),
              color: compareMode ? T.text : T.muted }}>
              {L.navLabels.compare}
            </span>
          </button>

          {/* 5. Favoris */}
          <button style={S.mobileBtn(T)} onClick={() => { setShowFavorites(v => !v); setShowFilters(false); setShowHelp(false); }}>
            <span style={{ ...S.mobileBtnIcon,
              color: showFavorites ? T.text : (Object.keys(favorites).length > 0 ? T.text : T.muted),
              fontSize:16 }}>
              {Object.keys(favorites).length > 0 ? "♥" : "♡"}
            </span>
            <span style={{ ...S.mobileBtnLabel(T) }}>
              {Object.keys(favorites).length > 0
                ? `${lang === "fr" ? "Favoris" : "Saved"} ${Object.keys(favorites).length}`
                : (lang === "fr" ? "Favoris" : "Saved")}
            </span>
          </button>

          {/* 6. Thème — icône seulement, sans label pour gagner de la place */}
          <button style={{ ...S.mobileBtn(T), minWidth:36 }} onClick={toggleDark}>
            <span style={{ ...S.mobileBtnIcon, fontSize:16 }}>{dark ? "◐" : "◑"}</span>
            <span style={{ ...S.mobileBtnLabel(T) }}>
              {L.themeLabel(dark)}
            </span>
          </button>

          {/* 7. Guide — encadré, visuellement différencié */}
          <button style={{
            ...S.mobileBtn(T),
          }} onClick={() => { setShowHelp(true); setShowFilters(false); setShowFavorites(false); }}>
            <span style={{ ...S.mobileBtnIcon, fontSize:16 }}>?</span>
            <span style={{ ...S.mobileBtnLabel(T) }}>
              {L.navLabels.guide}
            </span>
          </button>

        </nav>
        </>
      ) : (
        /* ── Nav desktop — barre complète ── */
        <nav style={{ ...S.nav, background: T.navBg, borderColor: T.border }}>

          <button style={{ ...S.navBtn, color: showFilters ? T.text : T.muted,
            background: showFilters ? T.pill : "transparent" }}
            onClick={toggleFilters}>
            {L.navLabels.filters}{(biomeFilter !== "all" || decade || roleFilter !== "all" || scoreMin > 2 || scoreMax < 10) ? " ·" : ""}
          </button>

          {showFilters && (
          <div style={{ ...S.filterDrawer, background: T.navBg, borderColor: T.border }}>
            {(() => {
              const chip = active => ({ ...S.navBtn, fontSize:13,
                color: active ? T.navBg : T.muted,
                background: active ? T.text : "transparent" });
              const row = (label, children) => (
                <div style={{ display:"flex", alignItems:"baseline", gap:14 }}>
                  <span style={{ width:64, flexShrink:0, fontSize:12, color:T.muted, opacity:0.7 }}>{label}</span>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:2 }}>{children}</div>
                </div>
              );
              const ROLE_WORDS = { fr:{all:"Tous",capital:"Capitales",city:"Villes",village:"Villages",hamlet:"Hameaux",bridge:"Ponts",satellite:"Satellites"}, en:{all:"All",capital:"Capitals",city:"Cities",village:"Villages",hamlet:"Hamlets",bridge:"Bridges",satellite:"Satellites"} };
              return (<>
                {row(lang === "fr" ? "Zone" : "Zone",
                  Object.entries(BIOME_META).map(([key, meta]) => (
                    <button key={key} style={chip(biomeFilter === key)} onClick={() => setBiomeFilter(key)}>
                      {meta[lang] || meta.fr}
                    </button>
                  )))}
                {row(lang === "fr" ? "Niveau" : "Level",
                  <LevelChips scoreMin={scoreMin} scoreMax={scoreMax} setScoreMin={setScoreMin} setScoreMax={setScoreMax}
                    T={T} lang={lang} chip={chip} />)}
                {row(lang === "fr" ? "Époque" : "Era",
                  DECADES.map(d => (
                    <button key={d ?? "all"} style={chip(decade === d)} onClick={() => setDecade(d)}>
                      {decadeLabel(d, lang)}
                    </button>
                  )))}
                {row(lang === "fr" ? "Rôle" : "Role",
                  Object.keys(ROLE_WORDS.fr).map(key => (
                    <button key={key} style={chip(roleFilter === key)} onClick={() => setRoleFilter(key)}>
                      {ROLE_WORDS[lang]?.[key] || key}
                    </button>
                  )))}
                <div style={{ alignSelf:"stretch", borderTop:`2px dotted ${T.border}`, paddingTop:12,
                  display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:24,
                  fontSize:13, color:T.text }}>
                  <span><b style={{ fontWeight:700 }}>{filteredWorks.length.toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")}</b>{" "}
                    {lang === "fr" ? (filteredWorks.length > 1 ? "œuvres sur le globe" : "œuvre sur le globe") : (filteredWorks.length === 1 ? "work on the globe" : "works on the globe")}
                    {filteredWorks.length === 0 && (lang === "fr" ? " — élargis un filtre" : " — widen a filter")}</span>
                  {filtersOn && <button style={{ ...S.navBtn, padding:0, color:T.muted, textDecoration:"underline", textUnderlineOffset:3 }}
                    onClick={resetFilters}>{lang === "fr" ? "Tout remettre" : "Clear all"}</button>}
                </div>
              </>);
            })()}
          </div>
          )}

          {sep}

          <SearchBar dark={dark} T={T} lang={lang} onSelect={w => {
            if (!filteredWorks.some(f => f.id === w.id)) resetFilters();
            handleSelect(w);
          }} />

          {sep}

          <div style={{ display:"flex", gap:3, flexShrink:0 }}>
            <button title="Atterrir au hasard" style={{ ...S.navBtn, color: T.muted, borderColor:"transparent" }}
              onClick={surprise}>{L.navLabels.random}</button>
            <button title={voyageMode ? "Arrêter" : "Voyager"} style={{
              ...S.navBtn,
              color: voyageMode ? T.text : T.muted,
              background: voyageMode ? T.pill : "transparent",
            }} onClick={() => voyageMode ? stopVoyage() : startVoyage(selectedWork||undefined)}>
              {voyageMode ? (lang === "fr" ? "Arrêter" : "Stop") : L.navLabels.voyage}
            </button>
            <button title="Comparer" style={{
              ...S.navBtn,
              color: compareMode ? T.text : T.muted,
              background: compareMode ? T.pill : "transparent",
            }} onClick={toggleCompare}>{L.navLabels.compare}</button>
            {(biomeFilter !== "all" || decade || roleFilter !== "all" || scoreMin > 2 || scoreMax < 10 || voyageMode || compareMode) && (
            <button style={{ ...S.navBtn, color: T.muted, borderColor:"transparent" }}
              onClick={() => { setBiomeFilter("all"); setScoreMin(2); setScoreMax(10); setDecade(null); setRoleFilter("all"); stopVoyage(); setCompareMode(false); }}>
              {L.filterReset}
            </button>
            )}
            <button style={{
              ...S.navBtn, color: T.muted,
              background: T.pill, fontFamily:"var(--font-ui)",
            }} onClick={toggleLang}>{L.nav.lang}</button>
            <button style={{ ...S.navBtn, color: T.muted, borderColor:"transparent" }}
              onClick={toggleDark}>{L.themeLabel(dark)}</button>
          </div>
        </nav>
      )}

      {/* Accueil — une seule recommandation, pas une légende */}
      {tonight && introComplete && !selectedWork && !showOnboarding && !voyageMode
        && !compareMode && !showFilters && !tonightDismissed
        && (!filtersOn || filteredWorks.some(w => w.id === tonight.id)) && (
        <div style={{ position:"fixed", left:20, bottom: mobile ? 80 : 26, zIndex:25,
          width: mobile ? "calc(100vw - 40px)" : 300, padding:"14px 16px",
          background: T.cardBg, border:"none", borderRadius:0,
          boxShadow:"none", animation:"fadeIn 0.6s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:T.muted }}>
            <span>{lang === "fr" ? "Ce soir" : "Tonight"}</span>
            <button onClick={() => setTonightDismissed(true)} aria-label={lang === "fr" ? "Fermer" : "Dismiss"}
              style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", padding:0, fontSize:12 }}>✕</button>
          </div>
          <div style={{ marginTop:6, fontSize:19, fontWeight:700, letterSpacing:"-0.025em", lineHeight:1.1, color:T.text }}>
            {tonight.title}
          </div>
          <div style={{ marginTop:4, fontSize:13, color:T.muted }}>
            {tonight.artist}{tonight.year ? ` · ${tonight.year}` : ""}
          </div>
          <button onClick={() => handleSelect(tonight)} style={{ marginTop:12, padding:"7px 14px",
            background:T.text, color:T.cardBg, border:"none", borderRadius:0, cursor:"pointer",
            fontSize:13, fontWeight:700, fontFamily:"var(--font-ui)" }}>
            {lang === "fr" ? "Écoute." : "Listen."}
          </button>
        </div>
      )}

      {/* Légende de surprise : l'écart réel avec l'œuvre quittée */}
      {/* Tirage : un titre après l'autre, de plus en plus lentement, puis celui qui reste.
          Blanc en mode différence : il s'inverse sur le globe comme sur le fond. */}
      {draw && (
        <div style={{ position:"fixed", inset:0, zIndex:36, pointerEvents:"none", mixBlendMode:"difference",
          color:"#ffffff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          textAlign:"center", fontFamily:"var(--font-ui)", padding:"0 6vw" }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ width:44, borderTop:"3px dotted #ffffff" }} />
            {lang === "fr" ? "Surprise" : "Surprise"}
            <span style={{ width:44, borderTop:"3px dotted #ffffff" }} />
          </div>
          <div key={draw.k} style={{ fontWeight:800, letterSpacing:"-0.05em",
            // Le titre tient dans le disque du globe : il rétrécit quand il s'allonge
            fontSize: draw.title.length > 40 ? "clamp(24px, 3vw, 40px)" : draw.title.length > 20 ? "clamp(28px, 4.2vw, 58px)" : "clamp(34px, 6.4vw, 92px)",
            lineHeight:1.0, maxWidth:"min(640px, 78vw)", textWrap:"balance", opacity: draw.last ? 1 : 0.9,
            animation: draw.last ? "drawLand 260ms cubic-bezier(.16,1,.3,1) both" : "drawTick 70ms linear both" }}>
            {draw.title}
          </div>
          <div style={{ fontSize:16, marginTop:14, minHeight:22, opacity: draw.last ? 1 : 0 }}>{draw.artist || ""}</div>
        </div>
      )}

      {/* Légende de surprise : l'écart réel avec l'œuvre quittée */}
      {trail && !draw && (() => {
        // Hors du globe, sous le logo : toujours sur le fond uni, dans la couleur du logo.
        const d = trail.from ? computeDistance(trail.from, trail.to) : null;
        const fromName = trail.from ? (trail.from.title || trail.from.artist || "") : "";
        const from = fromName ? (fromName.length > 30 ? fromName.slice(0, 29) + "…" : fromName) : null;
        return (
          <div key={trail.key} style={{ position:"fixed", top: mobile ? 14 : 78, left: mobile ? 16 : 20,
            zIndex:35, pointerEvents:"none", fontFamily:"var(--font-ui)", color:T.onBg,
            maxWidth: mobile ? "70vw" : 300, animation:"drawLand 520ms 380ms cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ width:56, borderTop:`3px dotted ${T.onBg}`, marginBottom:10 }} />
            <div style={{ fontSize:13, fontWeight:600 }}>
              {from ? <>{lang === "en" ? "Surprise · from" : "Surprise · depuis"} « {from} »</> : "Surprise"}
            </div>
            <div style={{ fontSize: mobile ? 28 : 40, fontWeight:800, letterSpacing:"-0.045em", lineHeight:1.02, marginTop:4 }}>
              {d !== null ? distanceLabel(d, lang) : (lang === "en" ? "First draw" : "Premier tirage")}
            </div>
          </div>
        );
      })()}

      {/* Hover card */}
      {hoveredWork && !selectedWork && !compareMode && (
        <div style={{ ...S.hoverCard, ...(mobile && voyageMode ? S.hoverCardVoyage : {}), background: T.cardBg, borderColor: T.border }}>
          {BIOME_META[hoveredWork.biome||hoveredWork.regime]?.color && (
            <span style={{ ...S.hoverDot,
              background: BIOME_META[hoveredWork.biome||hoveredWork.regime].color }} />
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontStyle:"normal", color: T.text,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {hoveredWork.title}
            </div>
            <div style={{ fontSize:12, color: T.muted, marginTop:2,
              fontFamily:"var(--font-ui)", letterSpacing:"0.005em" }}>
              {hoveredWork.artist}
              {hoveredWork.year && (
                <span style={{ marginLeft:6, opacity:0.6 }}>{hoveredWork.year}</span>
              )}
            </div>
            {/* Rôle avec description courte */}
            {hoveredWork.role && (
              <div style={{ fontSize:11, color: T.muted, marginTop:3, opacity:0.7,
                fontFamily:"var(--font-ui)", letterSpacing:"0.005em" }}>
                {(L.roles[hoveredWork.role] || hoveredWork.role)}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Wordmark — masqué sur mobile (trop haut pour le pouce) */}
      {!mobile && <div style={{ ...S.wordmark, cursor:"pointer" }}
        onClick={() => setShowOnboarding(true)}
        title={lang === "fr" ? "Changer de mode" : "Change mode"}>
        <span style={{ display:"block", fontSize:30, fontWeight:800,
          letterSpacing:"-0.035em", color: T.onBg, lineHeight:1 }}>lisn</span>
        <span style={{ display:"block", fontSize:13, letterSpacing:"0.005em",
          color: T.onBgMuted, fontFamily:"var(--font-ui)", marginTop:3,
          textTransform:"none" }}>
          {selectedWork ? "" : (lang === "fr" ? "Mais tu peux toujours aimer ce que tu aimes." : "But you can still like what you like.")}
        </span>
        <span style={{ display:"block", fontSize:11, letterSpacing:"0.005em",
          color: T.onBgMuted, fontFamily:"var(--font-ui)", marginTop:4,
          opacity:0.55, textTransform:"none" }}>
          {modeLabel !== L.modeLabels.globe ? modeLabel : ""}
        </span>
      </div>}

      {/* Panel sélection — caché en mode compare */}
      {!compareMode && !voyageMode && (
        <WorkPanel
          work={selectedWork}
          onClose={() => { setSelectedWork(null); setPanelTab("fiche"); if (voyageMode) stopVoyage(); }}
          dark={!dark} tab={panelTab} onTabChange={setPanelTab}
          nearbyWorks={nearbyWorks} trajectoryWorks={trajectoryWorks}
          onExploreAround={() => exploreAround(selectedWork)}
          onShowTrajectory={() => showTrajectory(selectedWork)}
          onSelectWork={handleSelect}
          onStartVoyage={() => startVoyage(selectedWork)}
          voyageMode={voyageMode}
          onRequestAnalysis={w => setAnalysisWork(w)}
          onRequestDiscuss={w => setDiscussWork(w)}
          mobile={mobile}
          lang={lang}
          coverUrl={coverUrl} tint={tint}
          isFavorite={isFavorite(selectedWork)}
          onToggleFavorite={() => toggleFavorite(selectedWork)}
          activeMode={activeMode}
        />
      )}

      {/* Modal analyse mock */}
      {analysisWork && (
        <AnalysisModal
          work={analysisWork}
          dark={dark}
          lang={lang}
          onClose={() => setAnalysisWork(null)}
        />
      )}

      {discussWork && (
        <DiscussModal
          work={discussWork}
          dark={dark}
          lang={lang}
          onClose={() => setDiscussWork(null)}
          onAnalyse={() => { setAnalysisWork(discussWork); setDiscussWork(null); }}
        />
      )}

      {/* ── A. Légende flottante ─────────────────────────────── */}
      {false && showLegend && (
        <div style={{
          position:"fixed", left:20, bottom: mobile ? (voyageMode ? 190 : 80) : 70,
          zIndex:25, display:"flex", flexDirection:"column", gap:5,
          fontFamily:"var(--font-ui)",
          animation:"fadeIn 0.5s ease",
        }}>
          {/* Taille = densité */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:3 }}>
              {[10,7,4].map((s,i) => (
                <div key={i} style={{
                  width:s, height:s, borderRadius:"50%",
                  background: T.text, opacity:0.5 - i*0.12, flexShrink:0,
                }} />
              ))}
            </div>
            <span style={{ fontSize:11, color:T.muted, letterSpacing:"0.005em",
              textTransform:"none" }}>
              {lang === "fr" ? "taille : densité" : "size: density"}
            </span>
          </div>
          {/* Couleurs biomes */}
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            {Object.entries(BIOME_META).filter(([k]) => k !== "all").map(([key, meta]) => (
              <div key={key} title={meta[lang] || meta.fr} style={{
                width:6, height:6, borderRadius:"50%",
                background: meta.color, flexShrink:0,
              }} />
            ))}
            <span style={{ fontSize:11, color:T.muted, letterSpacing:"0.005em",
              textTransform:"none" }}>
              {lang === "fr" ? "couleur : zone" : "color: zone"}
            </span>
          </div>
          {/* Fermer */}
          <button onClick={() => setShowLegend(false)} style={{
            background:"none", border:"none", cursor:"pointer",
            fontSize:11, color:T.muted, letterSpacing:"0.005em",
            textAlign:"left", padding:0, opacity:0.6,
            fontFamily:"var(--font-ui)", textTransform:"none",
          }}>
            {lang === "fr" ? "masquer" : "hide"}
          </button>
        </div>
      )}

      {/* Indicateur temporel selon zoom */}
      {false && (
        <div style={{
          position:"fixed",
          right: mobile ? 12 : 20,
          bottom: mobile ? (voyageMode ? 190 : 80) : 70,
          zIndex:25, textAlign:"right",
          fontFamily:"var(--font-ui)",
          pointerEvents:"none",
          opacity: Math.abs(globeZoom - 0.5) > 0.15 ? 0.7 : 0,
          transition:"opacity 0.6s ease",
        }}>
          <div style={{ fontSize:11, color:T.muted, letterSpacing:"0.005em",
            textTransform:"none" }}>
            {globeZoom > 0.75
              ? (lang === "fr" ? "vue d'ensemble" : "overview")
              : globeZoom < 0.35
              ? (lang === "fr" ? "couches profondes" : "deep layers")
              : null}
          </div>
          {globeZoom < 0.35 && (
            <div style={{ fontSize:11, color:T.muted, opacity:0.6, marginTop:2,
              letterSpacing:"0.005em" }}>
              {lang === "fr" ? "zoom → révèle les racines" : "zoom → reveals roots"}
            </div>
          )}
        </div>
      )}

      {/* Bouton pour réafficher la légende */}
      {false && !showLegend && (
        <button onClick={() => setShowLegend(true)} style={{
          position:"fixed", left:20, bottom: mobile ? (voyageMode ? 190 : 80) : 70,
          zIndex:25, background:"none", border:"none",
          cursor:"pointer", fontSize:11, color:T.muted,
          fontFamily:"var(--font-ui)", letterSpacing:"0.005em",
          padding:0, textTransform:"none", opacity:0.5,
        }}>
          {lang === "fr" ? "légende" : "legend"}
        </button>
      )}

      {/* ── C. Idle hint ───────────────────────────────────────── */}
      {showIdleHint && tonightDismissed && !selectedWork && !showOnboarding && !showFilters && (
        <div style={{
          position:"fixed", top:"50%", left:"50%",
          transform:"translate(-50%, -50%)",
          zIndex:15, pointerEvents:"none",
          display:"flex", flexDirection:"column", alignItems:"center", gap:8,
          animation:"fadeInUp 0.6s ease",
        }}>
          <div style={{
            fontSize:12, color:"#8c8c8c", letterSpacing:"0.005em",
            textTransform:"none", fontFamily:"var(--font-ui)",
            textAlign:"center", lineHeight:1.8,
          }}>
            {lang === "fr"
              ? <>Clique un point<br/>pour l'explorer</>
              : <>Click a point<br/>to explore it</>
            }
          </div>
          <div style={{
            fontSize:11, color:T.muted, opacity:0.5,
            fontFamily:"var(--font-ui)", letterSpacing:"0.005em",
            textTransform:"none",
          }}>
            {lang === "fr" ? "ou fais tourner le globe" : "or rotate the globe"}
          </div>
        </div>
      )}

      {/* Tutoriel gestuel mobile */}
      <GestureHint dark={dark} mobile={mobile} lang={lang} />

      {/* Mode d'emploi */}
      {/* Favoris panel */}
      {showFavorites && (
        <FavoritesPanel
          favorites={favorites}
          dark={dark} T={T} lang={lang}
          onSelect={handleSelect}
          onRemove={w => toggleFavorite(w)}
          onClose={() => setShowFavorites(false)}
        />
      )}

      {showHelp && <HelpPanel dark={dark} lang={lang} onClose={() => setShowHelp(false)} />}

      <style>{`
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes fadeInUp { from{opacity:0;transform:translate(-50%,-45%)} to{opacity:1;transform:translate(-50%,-50%)} }
  @keyframes voyageProgress { from{width:0} to{width:100%} }
  @keyframes onboardingTimer { from{width:0} to{width:100%} }
`}</style>
    </div>
  );
}

const S = {
  page:    { width:"100vw", height:"100vh", position:"relative", overflow:"hidden",
             fontFamily:"var(--font-ui)" },
  stage:   { position:"absolute", inset:0 },
  nav: {
    position:"absolute", bottom:18, left:"50%", transform:"translateX(-50%)",
    zIndex:40, display:"flex", alignItems:"center", gap:3,
    padding:"6px 10px", borderRadius:0, border:"none",
    backdropFilter:"none", WebkitBackdropFilter:"none",
    maxWidth:"calc(100vw - 24px)",
    boxShadow:"none",
  },
  filterDrawer: {
    position:"absolute", bottom:"calc(100% + 10px)", left:"50%", transform:"translateX(-50%)",
    display:"flex", flexDirection:"column", alignItems:"flex-start",
    gap:12, padding:"18px 20px", border:"none", borderRadius:0,
    width:"max-content", maxWidth:"calc(100vw - 48px)",
    boxShadow:"none",
  },
  navGroup: { display:"flex", alignItems:"center", gap:2, flexShrink:0 },
  navBtn: {
    background:"none", border:"none", borderRadius:0,
    fontSize:13, letterSpacing:"0.005em", padding:"6px 10px",
    cursor:"pointer", display:"flex", alignItems:"center", gap:4,
    fontFamily:"var(--font-ui)", textTransform:"none",
    transition:"all 0.12s", whiteSpace:"nowrap", flexShrink:0,
  },
  dot:  { width:5, height:5, borderRadius:"50%", flexShrink:0 },
  hoverCard: {
    position:"absolute", bottom:72, left:"50%", transform:"translateX(-50%)",
    border:"none", borderRadius:0, padding:"9px 14px",
    pointerEvents:"none", backdropFilter:"none",
    display:"flex", alignItems:"center", gap:10, minWidth:180, maxWidth:300,
  },
  hoverCardVoyage: {
    bottom: 180, // Au-dessus du VoyagePanel bottom sheet
  },
  hoverDot: { width:7, height:7, borderRadius:"50%", flexShrink:0 },
  voyageIndicator: {
    position:"absolute", top:18, right:20, zIndex:30,
    display:"flex", alignItems:"center", gap:8,
    padding:"8px 12px", borderRadius:0, border:"none",
    backdropFilter:"none", fontFamily:"var(--font-ui)",
  },
  wordmark: { position:"absolute", top:18, left:20, zIndex:10 },
  mobileBtn: T => ({
    background:"none", border:"none", cursor:"pointer",
    display:"flex", flexDirection:"column", alignItems:"center", gap:3,
    padding:"10px 4px", minWidth:40,
  }),
  mobileBtnIcon: { display:"none" },   // la barre mobile parle en mots
  mobileBtnLabel: T => ({
    fontSize:12, color: T.muted, fontFamily:"var(--font-ui)",
  }),
};
