"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";

const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
import GlobeScene    from "@/components/globe/GlobeScene";
import WorkPanel     from "@/components/globe/WorkPanel";
import SearchBar     from "@/components/globe/SearchBar";
import ComparePanel  from "@/components/globe/ComparePanel";
import AnalysisModal from "@/components/globe/AnalysisModal";
import { worksSeed } from "@/data/worksSeed";
import GestureHint from "@/components/globe/GestureHint";
import HelpPanel   from "@/components/globe/HelpPanel";

// ── Thème ──────────────────────────────────────────────────────────
const THEME = {
  dark: {
    // Fond quasi-noir, texte crème lumineux, muted lisible
    bg:      "#050403",
    text:    "#f2ead8",           // crème plus clair — contraste 17:1
    muted:   "#9c8e7e",           // warm grey — contraste 6.4:1 (était 3.7)
    border:  "rgba(242,234,216,0.14)",
    navBg:   "rgba(5,4,3,0.82)",  // plus opaque = meilleure lisibilité
    cardBg:  "rgba(5,4,3,0.96)",
    pill:    "rgba(242,234,216,0.08)",
    track:   "rgba(242,234,216,0.09)",
  },
  light: {
    // Fond ivoire chaud, texte encre sombre, muted lisible
    bg:      "#ede6dc",           // légèrement plus chaud
    text:    "#120e0a",           // quasi-noir chaud — contraste 15.5:1
    muted:   "#5c5048",           // brun moyen — contraste 6.3:1 (était 3.5)
    border:  "rgba(18,14,10,0.16)",
    navBg:   "rgba(237,230,220,0.86)",
    cardBg:  "rgba(237,230,220,0.97)",
    pill:    "rgba(18,14,10,0.07)",
    track:   "rgba(18,14,10,0.09)",
  },
};

const BIOME_META = {
  all:         { fr: "Tout",    en: "All",    color: null },
  dense:       { fr: "Dense",   en: "Dense",  color: "#FF6B2F" },
  atmospheric: { fr: "Atmos",   en: "Atmos",  color: "#4ABFFF" },
  structural:  { fr: "Struct",  en: "Struct", color: "#E8C97A" },
  narrative:   { fr: "Récit",   en: "Story",  color: "#FF9A4D" },
  hybrid:      { fr: "Hybride", en: "Hybrid", color: "#C07AE8" },
};

// Textes UI bilingues — tout ici, rien en dur ailleurs
const UI = {
  fr: {
    modeLabels: { compare:"comparer", voyage:"voyage", mountains:"montagnes", frontier:"frontières", globe:"globe" },
    nav: { random:"◎", voyage:"▷", voyageStop:"◼", compare:"⊕", reset:"↺", filters:"≡", guide:"Guide", lang:"EN" },
    navLabels: { random:"Hasard", voyage:"Voyage", filters:"Filtres", compare:"Comp.", theme:"Thème", guide:"Guide" },
    themeLabel: (dark) => dark ? "Clair" : "Sombre",
    voyageIndicator: "En voyage",
    filterTitle: "Biome",
    filterScore: (min, max) => `Intensité — ${min.toFixed(1)} → ${max.toFixed(1)}`,
    filterEra: "Époque",
    filterSearch: "Recherche",
    filterReset: "↺ Réinitialiser",
    onboarding: {
      tagline: "atlas des formes musicales",
      choices: [
        { key:"random",    icon:"◉", label:"Je tourne en rond",             desc:"Emmène-moi quelque part que je ne connais pas" },
        { key:"mountains", icon:"△", label:"Je veux ce qui compte vraiment", desc:"Les œuvres structurellement les plus fortes" },
        { key:"frontier",  icon:"◇", label:"Je veux sortir de ma zone",      desc:"Explorer des territoires inconnus" },
        { key:"free",      icon:"○", label:"Je sais déjà ce que je cherche", desc:"Navigation libre sur la carte" },
      ],
      helpLink: "Comment ça marche ? →",
      slogan: "Not more music. Better music.",
      skip: "Passer →",
    },
    hover: { year: "" },
    compare: { instruction1: "Cliquez une première œuvre sur le globe", instruction2: "Cliquez une deuxième œuvre à comparer" },
    workPanel: { exploreAround:"Explorer autour", trajectory:"Trajectoire de l'artiste", voyage:"Voyager depuis ici", voyageStop:"Arrêter le voyage", analyse:"Analyser dans LISN →", tabFiche:"Fiche", tabAround:"Autour", tabTrajectory:"Trajectoire", emptyHint:"Survolez une présence lumineuse,\ncliquez pour ouvrir sa fiche.", autourEmpty:"Cliquez l'onglet Autour sur la fiche pour voir les œuvres proches.", trajectoryEmpty:"Cliquez l'onglet Trajectoire pour voir l'évolution de l'artiste." },
    roles: { capital:"Capitale — œuvre fondatrice", city:"Ville — œuvre majeure", village:"Village — œuvre solide", bridge:"Pont — œuvre de transition", island:"Île — œuvre isolée, singulière", hamlet:"Hameau — œuvre mineure ou niche" },
    entityTypes: { album:"Album", artist:"Artiste", track:"Morceau" },
    biomeLabels: { dense:"Dense", atmospheric:"Atmosphérique", structural:"Structurel", narrative:"Narratif", hybrid:"Hybride" },
    scoreLabel: "Score OSR",
    roleLabel: "Rôle",
    biomeLabel: "Zone",
    typeLabel: "Type",
    yearLabel: "Année",
    analysisModal: { badge:"Analyse LISN · Aperçu", scoreLabel:"Score OSR estimé", structureLabel:"Aperçu structurel", noticeHead:"Le verdict LISN complet", noticeBody:"L'analyse complète — verdict éditorial, scores dimensionnels, worldview — sera disponible dès que cette œuvre sera analysée.", noticeNote:"Ces données sont des estimations." },
    comparePanel: { title:"Comparaison structurale", slotA:"A", slotB:"B", distLabel:"Distance structurale", instruction1:"Cliquez deux œuvres sur le globe pour les comparer.", instruction2:"Cliquez une deuxième œuvre pour comparer.", levels: { veryClose:"Très proches", close:"Proches", far:"Éloignées", veryFar:"Très éloignées", opposite:"Mondes opposés" } },
    audio: { loading:"Recherche sur YouTube…", notFound:"Non trouvé", reduce:"▾ Réduire", listen:"▸ Écouter", listenYT:"▸ Écouter sur YouTube" },
    gestureHints: [{ icon:"pinch", label:"Pince pour zoomer" }, { icon:"rotate", label:"Glisse pour tourner" }],
  },
  en: {
    modeLabels: { compare:"compare", voyage:"journey", mountains:"peaks", frontier:"frontier", globe:"globe" },
    nav: { random:"◎", voyage:"▷", voyageStop:"◼", compare:"⊕", reset:"↺", filters:"≡", guide:"Guide", lang:"FR" },
    navLabels: { random:"Random", voyage:"Voyage", filters:"Filters", compare:"Comp.", theme:"Theme", guide:"Guide" },
    themeLabel: (dark) => dark ? "Light" : "Dark",
    voyageIndicator: "Voyaging",
    filterTitle: "Zone",
    filterScore: (min, max) => `Intensity — ${min.toFixed(1)} → ${max.toFixed(1)}`,
    filterEra: "Era",
    filterSearch: "Search",
    filterReset: "↺ Reset",
    onboarding: {
      tagline: "a map of musical forms",
      choices: [
        { key:"random",    icon:"◉", label:"I keep hearing the same things",    desc:"Take me somewhere I don't know yet" },
        { key:"mountains", icon:"△", label:"I want what truly matters",          desc:"The most structurally powerful works" },
        { key:"frontier",  icon:"◇", label:"I want out of my comfort zone",      desc:"Explore unknown territories" },
        { key:"free",      icon:"○", label:"I know what I'm looking for",        desc:"Free navigation on the map" },
      ],
      helpLink: "How does this work? →",
      slogan: "Not more music. Better music.",
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

// ── VoyagePanel — contrôles voyage enrichis (B+C) ───────────────────
function VoyagePanel({ work, dark, T, lang, isFav, onToggleFav, onNext, onStop, autoPlayEnabled = false }) {
  const biomeColor = {
    dense:"#FF6B2F", atmospheric:"#4ABFFF", structural:"#E8C97A",
    narrative:"#FF9A4D", hybrid:"#C07AE8",
  }[work?.biome || work?.regime] || T.text;

  // C. Auto-play YouTube — iframe caché qui joue dès que l'œuvre change
  const [videoId, setVideoId]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const prevWorkId = useRef(null);

  useEffect(() => {
    // Ne pas fetch si autoplay pas encore autorisé (intro pas terminée)
    if (!work || !autoPlayEnabled) return;
    if (work.id === prevWorkId.current) return;
    prevWorkId.current = work.id;
    setVideoId(null);
    setLoading(true);
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
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : null;

  return (
    <div style={{
      position:"fixed", top:18, right: 20,
      zIndex:50,
      width:"min(320px, calc(100vw - 40px))",
      background: T.cardBg,
      border:`1px solid ${biomeColor}`,
      borderRadius:1,
      backdropFilter:"blur(18px)",
      WebkitBackdropFilter:"blur(18px)",
      overflow:"hidden",
      fontFamily:"'Libre Baskerville', Georgia, serif",
    }}>
      {/* Bande couleur biome */}
      <div style={{ height:2, background: biomeColor }} />

      {/* Header — titre + artiste */}
      <div style={{ padding:"12px 14px 10px",
        display:"flex", alignItems:"flex-start", gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:9, color:T.muted, letterSpacing:"0.14em",
            textTransform:"uppercase", fontFamily:"'DM Mono',monospace", marginBottom:4 }}>
            {lang === "fr" ? "En voyage" : "On a journey"}
            {loading && <span style={{ marginLeft:6, opacity:0.5 }}>·</span>}
          </div>
          <div style={{ fontSize:15, fontStyle:"italic", color:T.text,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            lineHeight:1.2 }}>
            {work.title}
          </div>
          <div style={{ fontSize:11, color:T.muted, marginTop:3 }}>
            {work.artist}
            {work.year && <span style={{ marginLeft:6, opacity:0.5 }}>{work.year}</span>}
          </div>
        </div>
        {/* Score */}
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontSize:16, color:biomeColor,
            fontFamily:"'DM Mono',monospace", fontWeight:500 }}>
            {Number(work.score||0).toFixed(1)}
          </div>
          <div style={{ fontSize:8, color:T.muted,
            fontFamily:"'DM Mono',monospace" }}>/10</div>
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
          borderRadius:1, padding:"6px 10px", cursor:"pointer",
          color: isFav ? biomeColor : T.muted,
          fontSize:13, display:"flex", alignItems:"center", gap:5,
          fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em",
          transition:"all 0.15s",
        }}>
          {isFav ? "♥" : "♡"}
          <span style={{ fontSize:9, textTransform:"uppercase" }}>
            {lang === "fr" ? (isFav ? "Sauvé" : "Sauver") : (isFav ? "Saved" : "Save")}
          </span>
        </button>

        {/* Boutons navigation */}
        <div style={{ display:"flex", gap:6 }}>
          {/* → Suivant */}
          <button onClick={onNext} style={{
            background:"none", border:`1px solid ${T.border}`,
            borderRadius:1, padding:"6px 12px", cursor:"pointer",
            color:T.text, fontSize:12,
            display:"flex", alignItems:"center", gap:4,
            fontFamily:"'DM Mono',monospace",
            transition:"border-color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.text}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >
            <span style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em",
              color:T.muted }}>
              {lang === "fr" ? "Suivant" : "Next"}
            </span>
            <span>→</span>
          </button>

          {/* ◼ Stop */}
          <button onClick={onStop} style={{
            background:"none", border:`1px solid ${T.border}`,
            borderRadius:1, padding:"6px 10px", cursor:"pointer",
            color:T.muted, fontSize:10,
            fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em",
            textTransform:"uppercase",
          }}>
            ◼
          </button>
        </div>
      </div>

      {/* Mini lien "ouvrir YouTube" si vidéo trouvée */}
      {videoId && (
        <div style={{ padding:"0 14px 10px" }}>
          <a href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize:8, color:T.muted, opacity:0.5,
              fontFamily:"'DM Mono',monospace", letterSpacing:"0.10em",
              textTransform:"uppercase", textDecoration:"none" }}>
            {lang === "fr" ? "Ouvrir dans YouTube →" : "Open in YouTube →"}
          </a>
        </div>
      )}
    </div>
  );
}

// ── FavoritesPanel — liste des œuvres sauvegardées ────────────────
function FavoritesPanel({ favorites, dark, T, lang, onSelect, onRemove, onClose }) {
  const fav = Object.values(favorites).sort((a,b) => (b.savedAt||0) - (a.savedAt||0));
  const BIOME_COLOR = {
    dense:"#FF6B2F", atmospheric:"#4ABFFF", structural:"#E8C97A",
    narrative:"#FF9A4D", hybrid:"#C07AE8",
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:100,
      background: T.cardBg, overflowY:"auto",
      fontFamily:"'Libre Baskerville', Georgia, serif",
      color:T.text,
    }}>
      {/* Header */}
      <div style={{
        position:"sticky", top:0, zIndex:10,
        padding:"16px 20px",
        borderBottom:`1px solid ${T.border}`,
        background: T.cardBg,
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <div>
          <div style={{ fontSize:17, fontStyle:"italic", letterSpacing:"-0.02em" }}>
            {lang === "fr" ? "Mes favoris" : "My favorites"}
          </div>
          <div style={{ fontSize:9, color:T.muted, fontFamily:"'DM Mono',monospace",
            letterSpacing:"0.16em", textTransform:"uppercase", marginTop:3 }}>
            {fav.length} {lang === "fr" ? "œuvre" : "work"}{fav.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button onClick={onClose} style={{
          background:"none", border:`1px solid ${T.border}`, color:T.muted,
          fontSize:9, padding:"5px 10px", cursor:"pointer", borderRadius:1,
          fontFamily:"'DM Mono',monospace", letterSpacing:"0.14em",
        }}>
          {lang === "fr" ? "FERMER" : "CLOSE"}
        </button>
      </div>

      {/* Liste */}
      <div style={{ padding:"16px 20px", maxWidth:520, margin:"0 auto" }}>
        {fav.length === 0 ? (
          <div style={{ fontSize:13, color:T.muted, lineHeight:1.75,
            fontStyle:"italic", marginTop:20 }}>
            {lang === "fr"
              ? "Aucun favori pour l'instant. Appuie sur ♥ pendant un voyage pour sauvegarder une œuvre."
              : "No favorites yet. Press ♥ during a voyage to save a work."}
          </div>
        ) : (
          fav.map(w => (
            <div key={w.id} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"10px 0",
              borderBottom:`1px solid ${T.border}`,
            }}>
              <span style={{ width:7, height:7, borderRadius:"50%", flexShrink:0,
                background: BIOME_COLOR[w.biome] || T.muted }} />
              <div style={{ flex:1, minWidth:0, cursor:"pointer" }}
                onClick={() => { onSelect(w); onClose(); }}>
                <div style={{ fontSize:13, fontStyle:"italic", color:T.text,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {w.title}
                </div>
                <div style={{ fontSize:10, color:T.muted, marginTop:2,
                  fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em" }}>
                  {w.artist}
                  {w.year && <span style={{ marginLeft:6, opacity:0.6 }}>{w.year}</span>}
                </div>
              </div>
              <span style={{ fontSize:11, color:T.muted,
                fontFamily:"'DM Mono',monospace", flexShrink:0 }}>
                {Number(w.score||0).toFixed(1)}
              </span>
              <button onClick={() => onRemove(w)} style={{
                background:"none", border:"none", cursor:"pointer",
                color:T.muted, fontSize:12, padding:"0 4px", opacity:0.5,
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
  const bg = dark
    ? "radial-gradient(ellipse at 50% 60%, rgba(14,10,6,0.94) 0%, rgba(4,3,2,0.99) 100%)"
    : "radial-gradient(ellipse at 50% 60%, rgba(240,233,224,0.94) 0%, rgba(228,221,212,0.99) 100%)";

  const choices = L.onboarding.choices;

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
          {L.onboarding.tagline}
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
      <div style={{ marginTop:32, display:"flex", flexDirection:"column",
        alignItems:"center", gap:10 }}>
        <button onClick={() => { onChoose("free"); onShowHelp?.(); }}
          style={{ background:"none", border:"none", cursor:"pointer",
            fontSize:9, color:T.muted, fontFamily:"'DM Mono',monospace",
            letterSpacing:"0.14em", textTransform:"uppercase", textDecoration:"underline",
            textUnderlineOffset:3 }}>
          {L.onboarding.helpLink}
        </button>
        <div style={{ fontSize:9, letterSpacing:"0.14em", color:T.muted,
          fontFamily:"'DM Mono',monospace", textTransform:"uppercase", opacity:0.6 }}>
          Not more music. Better music.
        </div>
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────────────────────────
export default function HomePage() {
  const [dark, setDark] = useState(true);
  const [mobile,   setMobile]   = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  // Lancer idle hint 8s après la fin de l'intro
  useEffect(() => {
    if (!introComplete) return;
    const t = setTimeout(() => setShowIdleHint(true), 8000);
    return () => clearTimeout(t);
  }, [introComplete]);
  const [showFilters,     setShowFilters]     = useState(false);
  const [showHelp,        setShowHelp]        = useState(false);
  const [showLegend,      setShowLegend]      = useState(true);
  const [lang, setLang] = useState("fr"); // défaut FR, ajusté au mount
  const [showOnboarding,  setShowOnboarding]  = useState(false);
  const [selectedWork,    setSelectedWork]    = useState(null);
  const [hoveredWork,     setHoveredWork]     = useState(null);
  const [biomeFilter,     setBiomeFilter]     = useState("all");
  const [scoreMin,        setScoreMin]        = useState(2);
  const [scoreMax,        setScoreMax]        = useState(10);
  const [decade,          setDecade]          = useState(null); // null = toutes
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

  // Modes spéciaux
  const [voyageMode,    setVoyageMode]    = useState(false);
  const [voyageCurrent, setVoyageCurrent] = useState(null);
  const [compareMode,   setCompareMode]   = useState(false);
  const [compareA,      setCompareA]      = useState(null);
  const [compareB,      setCompareB]      = useState(null);
  const voyageTimer  = useRef(null);
  const idleHintTimer = useRef(null);
  const [showIdleHint, setShowIdleHint] = useState(false);
  const [analysisWork, setAnalysisWork] = useState(null);

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

    if (key === "random") {
      // "Je tourne en rond" → voyage automatique depuis un point aléatoire
      // Lance le voyage 500ms après la fermeture de l'onboarding
      setTimeout(() => startVoyage(), 500);

    } else if (key === "mountains") {
      // "Je veux ce qui compte vraiment" → zoom vers les grandes œuvres
      setScoreMin(8.5); setScoreMax(10);
      // Atterrir sur une capitale aléatoire
      const capitals = worksSeed.filter(w =>
        (w.role === "capital" || w.score >= 9.0)
      );
      if (capitals.length) {
        const pick = capitals[Math.floor(Math.random() * capitals.length)];
        setTimeout(() => handleSelect(pick), 600);
      }

    } else if (key === "frontier") {
      // "Je veux sortir de ma zone" → atterrir sur une île/hameau puis voyager
      const isolated = worksSeed.filter(w =>
        w.role === "island" || w.biome === "atmospheric" || w.score < 5.5
      );
      const pool = isolated.length > 10 ? isolated : worksSeed;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setTimeout(() => startVoyage(pick), 500);

    }
    // "free" → rien — navigation libre
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

  function scheduleNext(cur, immediate = false) {
    clearTimeout(voyageTimer.current);
    const delay = immediate ? 0 : 6000; // 6s — assez long pour entendre l'intro
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
  useEffect(() => () => clearTimeout(voyageTimer.current), []);

  // ── Compare ────────────────────────────────────────────────────
  function toggleCompare() {
    if (compareMode) { setCompareMode(false); setCompareA(null); setCompareB(null); }
    else             { setCompareMode(true); stopVoyage(); }
  }

  // ── Sélection (gère aussi le mode compare) ────────────────────
  function handleSelect(work) {
    setShowIdleHint(false);
    clearTimeout(idleHintTimer.current);
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
  const L = UI[lang] || UI.fr;

  const modeLabel = compareMode ? L.modeLabels.compare
    : voyageMode ? L.modeLabels.voyage
    : scoreMin > 7.5 ? L.modeLabels.mountains
    : scoreMax < 5 ? L.modeLabels.frontier
    : decade ? `${decade}s`
    : biomeFilter !== "all" ? (BIOME_META[biomeFilter]?.[lang] || BIOME_META[biomeFilter]?.fr || "").toLowerCase()
    : L.modeLabels.globe;

  const sep = <div style={{ width:1, height:14, background: T.border, margin:"0 3px", flexShrink:0 }} />;

  // Éviter l'hydratation mismatch — ne rendre qu'après le mount côté client
  if (!mounted) {
    return (
      <div style={{ ...S.page, background: "#050403" }} />
    );
  }

  return (
    <div style={{ ...S.page, background: T.bg, color: T.text }}>

      {showOnboarding && <Onboarding dark={dark} lang={lang} onChoose={handleOnboardingChoice} onShowHelp={() => setShowHelp(true)} />}

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
          mobile={mobile}
          onIntroComplete={() => setIntroComplete(true)}
        />
      </div>

      {/* ── B+C. Panneau de voyage enrichi ───────────────── */}
      {voyageMode && voyageCurrent && (
        <VoyagePanel
          work={voyageCurrent}
          dark={dark} T={T} lang={lang}
          isFav={isFavorite(voyageCurrent)}
          onToggleFav={() => toggleFavorite(voyageCurrent)}
          onNext={voyageNext}
          onStop={stopVoyage}
          autoPlayEnabled={introComplete}
        />
      )}

      {/* Panel compare */}
      {compareMode && (
        <ComparePanel
          workA={compareA} workB={compareB}
          onClearA={() => setCompareA(null)}
          onClearB={() => setCompareB(null)}
          dark={dark} T={T} lang={lang}
        />
      )}

      {/* ── Nav ──────────────────────────────────────────────── */}
      {mobile ? (
        <>
        {/* ── Drawer filtres mobile ── */}
        {showFilters && (
          <div style={{
            position:"fixed", left:0, right:0, bottom:64, zIndex:35,
            background: T.navBg, borderTop:`1px solid ${T.border}`,
            backdropFilter:"blur(18px)", padding:"16px",
            maxHeight:"60vh", overflowY:"auto",
          }}>
            {/* Biomes */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, letterSpacing:"0.14em", color:T.muted,
                fontFamily:"'DM Mono',monospace", textTransform:"uppercase", marginBottom:8 }}>
                {L.filterTitle}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {Object.entries(BIOME_META).map(([key, meta]) => {
                  const active = biomeFilter === key;
                  return (
                    <button key={key} onClick={() => setBiomeFilter(key)} style={{
                      padding:"6px 12px", border:`1px solid ${active ? (meta.color||T.border) : T.border}`,
                      borderRadius:1, background: active ? T.pill : "none",
                      color: active && meta.color ? meta.color : T.text,
                      fontSize:11, cursor:"pointer",
                      fontFamily:"'DM Mono',monospace",
                    }}>
                      {meta[lang] || meta.fr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Score range */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, letterSpacing:"0.14em", color:T.muted,
                fontFamily:"'DM Mono',monospace", textTransform:"uppercase", marginBottom:8 }}>
                {L.filterScore(scoreMin, scoreMax)}
              </div>
              <div style={{ display:"flex", gap:16 }}>
                <Slider label="Min" value={scoreMin} min={2} max={9} step={0.5}
                  onChange={setScoreMin} T={T} fmt={v => v.toFixed(1)} />
                <Slider label="Max" value={scoreMax} min={3} max={10} step={0.5}
                  onChange={setScoreMax} T={T} fmt={v => v.toFixed(1)} />
              </div>
            </div>

            {/* Décennies */}
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:9, letterSpacing:"0.14em", color:T.muted,
                fontFamily:"'DM Mono',monospace", textTransform:"uppercase", marginBottom:8 }}>
                {L.filterEra}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {DECADES.map(d => {
                  const active = decade === d;
                  return (
                    <button key={d??'all'} onClick={() => setDecade(active ? null : d)} style={{
                      padding:"6px 10px", border:`1px solid ${active ? T.border : T.border}`,
                      borderRadius:1, background: active ? T.pill : "none",
                      color: active ? T.text : T.muted,
                      fontSize:11, cursor:"pointer",
                      fontFamily:"'DM Mono',monospace",
                    }}>
                      {d ? `${String(d).slice(2)}s` : "∞"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recherche */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, letterSpacing:"0.14em", color:T.muted,
                fontFamily:"'DM Mono',monospace", textTransform:"uppercase", marginBottom:8 }}>
                {L.filterSearch}
              </div>
              <SearchBar dark={dark} T={T} onSelect={w => {
                handleSelect(w);
                setBiomeFilter("all");
                setShowFilters(false);
              }} />
            </div>

            {/* Reset */}
            <button onClick={() => { setBiomeFilter("all"); setScoreMin(2); setScoreMax(10); setDecade(null); setShowFilters(false); }}
              style={{ marginTop:8, width:"100%", padding:"10px", border:`1px solid ${T.border}`,
                background:"none", color:T.muted, fontSize:10, cursor:"pointer",
                fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em" }}>
              {L.filterReset}
            </button>
          </div>
        )}

        {/* ── Nav mobile — barre fixe en bas ── */}
        <nav style={{
          position:"fixed", bottom:0, left:0, right:0, height:64,
          zIndex:40, display:"flex", alignItems:"center",
          justifyContent:"space-around",
          paddingBottom:"env(safe-area-inset-bottom)",
          background: T.navBg, borderTop:`1px solid ${T.border}`,
          backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
          touchAction:"manipulation",
        }}>
          <button style={S.mobileBtn(T)} onClick={() => landRandom()}>
            <span style={S.mobileBtnIcon}>◎</span>
            <span style={S.mobileBtnLabel(T)}>{L.navLabels.random}</span>
          </button>
          <button style={S.mobileBtn(T)}
            onClick={() => voyageMode ? stopVoyage() : startVoyage(selectedWork||undefined)}>
            <span style={{ ...S.mobileBtnIcon, color: voyageMode ? T.text : T.muted }}>
              {voyageMode ? "◼" : "▷"}
            </span>
            <span style={S.mobileBtnLabel(T)}>{L.navLabels.voyage}</span>
          </button>
          <button style={S.mobileBtn(T)}
            onClick={() => setShowFilters(v => !v)}>
            <span style={{ ...S.mobileBtnIcon, color: showFilters ? T.text : T.muted }}>
              ≡
            </span>
            <span style={{ ...S.mobileBtnLabel(T), color: showFilters ? T.text : T.muted }}>
              {L.navLabels.filters}
            </span>
          </button>
          <button style={S.mobileBtn(T)} onClick={toggleCompare}>
            <span style={{ ...S.mobileBtnIcon, color: compareMode ? T.text : T.muted }}>⊕</span>
            <span style={S.mobileBtnLabel(T)}>{L.navLabels.compare}</span>
          </button>
          <button style={S.mobileBtn(T)} onClick={toggleDark}>
            <span style={S.mobileBtnIcon}>{dark ? "◐" : "◑"}</span>
            <span style={S.mobileBtnLabel(T)}>{L.themeLabel(dark)}</span>
          </button>
          <button style={S.mobileBtn(T)} onClick={toggleLang}>
            <span style={{ ...S.mobileBtnIcon, fontSize:11, fontFamily:"'DM Mono',monospace" }}>
              {lang === "fr" ? "FR" : "EN"}
            </span>
            <span style={S.mobileBtnLabel(T)}>{L.nav.lang}</span>
          </button>
          <button style={S.mobileBtn(T)} onClick={() => setShowFavorites(v => !v)}>
            <span style={{ ...S.mobileBtnIcon, color: showFavorites ? T.text : T.muted }}>
              {Object.keys(favorites).length > 0 ? "♥" : "♡"}
            </span>
            <span style={S.mobileBtnLabel(T)}>
              {lang === "fr" ? "Favoris" : "Saved"}
            </span>
          </button>
          <button style={S.mobileBtn(T)} onClick={() => setShowHelp(true)}>
            <span style={S.mobileBtnIcon}>?</span>
            <span style={S.mobileBtnLabel(T)}>{L.navLabels.guide}</span>
          </button>
        </nav>
        </>
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
                  {meta[lang] || meta.fr}
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
            <span style={{ ...S.hoverDot,
              background: BIOME_META[hoveredWork.biome||hoveredWork.regime].color }} />
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontStyle:"italic", color: T.text,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {hoveredWork.title}
            </div>
            <div style={{ fontSize:10, color: T.muted, marginTop:2,
              fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em" }}>
              {hoveredWork.artist}
              {hoveredWork.year && (
                <span style={{ marginLeft:6, opacity:0.6 }}>{hoveredWork.year}</span>
              )}
            </div>
            {/* Rôle avec description courte */}
            {hoveredWork.role && (
              <div style={{ fontSize:9, color: T.muted, marginTop:3, opacity:0.7,
                fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em" }}>
                {(L.roles[hoveredWork.role] || hoveredWork.role)}
              </div>
            )}
          </div>
          {hoveredWork.score && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end",
              gap:2, flexShrink:0 }}>
              <span style={{ fontSize:13, color: T.text,
                fontFamily:"'DM Mono',monospace", fontWeight:500 }}>
                {Number(hoveredWork.score).toFixed(1)}
              </span>
              <span style={{ fontSize:8, color: T.muted, opacity:0.6,
                fontFamily:"'DM Mono',monospace" }}>/10</span>
            </div>
          )}
        </div>
      )}

      {/* Mode compare — instruction */}
      {compareMode && !compareA && (
        <div style={{ ...S.hoverCard, background: T.cardBg, borderColor: T.border,
          pointerEvents:"none" }}>
          <span style={{ fontSize:10, color: T.muted, fontFamily:"'DM Mono',monospace",
            letterSpacing:"0.1em" }}>{L.compare.instruction1}</span>
        </div>
      )}
      {compareMode && compareA && !compareB && (
        <div style={{ ...S.hoverCard, background: T.cardBg, borderColor: T.border,
          pointerEvents:"none" }}>
          <span style={{ fontSize:10, color: T.muted, fontFamily:"'DM Mono',monospace",
            letterSpacing:"0.1em" }}>{L.compare.instruction2}</span>
        </div>
      )}

      {/* Wordmark — clic = réouvrir l'onboarding */}
      <div style={{ ...S.wordmark, cursor:"pointer" }}
        onClick={() => setShowOnboarding(true)}
        title={lang === "fr" ? "Changer de mode" : "Change mode"}>
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
          {lang === "fr" ? "Expand your musical taste" : "Expand your musical taste"}
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
          mobile={mobile}
          lang={lang}
          isFavorite={isFavorite(selectedWork)}
          onToggleFavorite={() => toggleFavorite(selectedWork)}
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

      {/* ── A. Légende flottante ─────────────────────────────── */}
      {showLegend && !showOnboarding && (
        <div style={{
          position:"fixed", left:20, bottom: mobile ? 80 : 70,
          zIndex:25, display:"flex", flexDirection:"column", gap:5,
          fontFamily:"'DM Mono',monospace",
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
            <span style={{ fontSize:8, color:T.muted, letterSpacing:"0.10em",
              textTransform:"uppercase" }}>
              {lang === "fr" ? "taille = densité" : "size = density"}
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
            <span style={{ fontSize:8, color:T.muted, letterSpacing:"0.10em",
              textTransform:"uppercase" }}>
              {lang === "fr" ? "couleur = zone" : "color = zone"}
            </span>
          </div>
          {/* Fermer */}
          <button onClick={() => setShowLegend(false)} style={{
            background:"none", border:"none", cursor:"pointer",
            fontSize:8, color:T.muted, letterSpacing:"0.10em",
            textAlign:"left", padding:0, opacity:0.6,
            fontFamily:"'DM Mono',monospace", textTransform:"uppercase",
          }}>
            {lang === "fr" ? "masquer" : "hide"}
          </button>
        </div>
      )}

      {/* Bouton pour réafficher la légende */}
      {!showLegend && !showOnboarding && (
        <button onClick={() => setShowLegend(true)} style={{
          position:"fixed", left:20, bottom: mobile ? 80 : 70,
          zIndex:25, background:"none", border:"none",
          cursor:"pointer", fontSize:9, color:T.muted,
          fontFamily:"'DM Mono',monospace", letterSpacing:"0.10em",
          padding:0, textTransform:"uppercase", opacity:0.5,
        }}>
          {lang === "fr" ? "légende" : "legend"}
        </button>
      )}

      {/* ── C. Idle hint ───────────────────────────────────────── */}
      {showIdleHint && !selectedWork && !showOnboarding && (
        <div style={{
          position:"fixed", top:"50%", left:"50%",
          transform:"translate(-50%, -50%)",
          zIndex:15, pointerEvents:"none",
          display:"flex", flexDirection:"column", alignItems:"center", gap:8,
          animation:"fadeInUp 0.6s ease",
        }}>
          <div style={{
            fontSize:11, color:T.muted, letterSpacing:"0.18em",
            textTransform:"uppercase", fontFamily:"'DM Mono',monospace",
            textAlign:"center", lineHeight:1.8,
            textShadow: dark ? "0 0 20px rgba(0,0,0,0.8)" : "0 0 20px rgba(237,230,220,0.9)",
          }}>
            {lang === "fr"
              ? <>Clique un point<br/>pour l'explorer</>
              : <>Click a point<br/>to explore it</>
            }
          </div>
          <div style={{
            fontSize:9, color:T.muted, opacity:0.5,
            fontFamily:"'DM Mono',monospace", letterSpacing:"0.14em",
            textTransform:"uppercase",
            textShadow: dark ? "0 0 20px rgba(0,0,0,0.8)" : "0 0 20px rgba(237,230,220,0.9)",
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
