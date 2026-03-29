"use client";

/**
 * AnalysisModal — vue mock propre quand on clique "Analyser dans LISN"
 * Pas de navigation, pas de 404. Affiche une fiche enrichie locale
 * avec un message clair "Analyse complète à venir".
 */

const BIOME_COLOR = {
  dense:"#FF6B2F", atmospheric:"#4ABFFF", structural:"#E8C97A",
  narrative:"#FF9A4D", hybrid:"#C07AE8",
};
const BIOME_LABEL = {
  dense:"Dense", atmospheric:"Atmosphérique", structural:"Structural",
  narrative:"Narratif", hybrid:"Hybride",
};
const ROLE_LABEL = {
  capital:"Capitale", city:"Ville", village:"Village",
  bridge:"Pont", island:"Île", hamlet:"Hameau",
};

// Textes mock par biome — évocateurs, pas définitifs
const MOCK_VERDICTS = {
  dense:       "Structure de haute densité — contraintes multiples en tension simultanée.",
  atmospheric: "Espace sonore expansif — le timbre comme forme principale.",
  structural:  "Architecture formelle — la contrainte comme principe organisateur.",
  narrative:   "Trajectoire subjective — le flux narratif structure l'œuvre.",
  hybrid:      "Zone de mutation — plusieurs logiques en coexistence instable.",
};

export default function AnalysisModal({ work, dark, onClose }) {
  if (!work) return null;

  const biome   = work.biome || work.regime;
  const col     = BIOME_COLOR[biome] || "#e8dfc8";
  const verdict = MOCK_VERDICTS[biome] || "Forme musicale en attente d'analyse structurale complète.";

  const bg      = dark ? "rgba(4,3,2,0.98)"      : "rgba(228,221,212,0.98)";
  const overlay = dark ? "rgba(0,0,0,0.72)"       : "rgba(100,90,80,0.45)";
  const border  = dark ? "rgba(232,223,200,0.12)" : "rgba(26,20,16,0.14)";
  const text    = dark ? "#e8dfc8"                : "#1a1410";
  const muted   = dark ? "rgba(232,223,200,0.45)" : "rgba(26,20,16,0.45)";
  const trackBg = dark ? "rgba(232,223,200,0.07)" : "rgba(26,20,16,0.08)";

  const score   = Number(work.score || 0);
  const scorePct = Math.round((score / 10) * 100);

  // Champs mock dérivés du score
  const structural  = Math.round(score * 8.5 + (Math.random() * 6 - 3));
  const exploration = Math.round(score * 7.2 + (Math.random() * 8 - 4));
  const dims = [
    { label: "Score global",   value: score.toFixed(1), unit: "/10", highlight: true },
    { label: "Intensité",      value: Math.min(99, structural),  unit: "/100" },
    { label: "Exploration",    value: Math.min(99, exploration), unit: "/100" },
    { label: "Biome",          value: BIOME_LABEL[biome] || biome || "—", color: col },
    { label: "Rôle structural",value: ROLE_LABEL[work.role] || work.role || "—" },
    { label: "Type",           value: work.entityType === "album" ? "Album" : work.entityType === "artist" ? "Artiste" : "Morceau" },
  ];

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center",
      background: overlay,
      backdropFilter:"blur(4px)",
      fontFamily:"'Libre Baskerville', Georgia, serif",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        width:"min(460px, calc(100vw - 32px))",
        maxHeight:"85vh", overflowY:"auto",
        background: bg, border:`1px solid ${border}`,
        borderRadius:1, position:"relative",
      }}>
        {/* Bande biome */}
        <div style={{ height:2, background: col }} />

        {/* Header */}
        <div style={{ padding:"18px 20px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase",
              color: muted, fontFamily:"'DM Mono',monospace" }}>
              Analyse LISN · Aperçu
            </div>
            <button onClick={onClose} style={{
              background:"none", border:`1px solid ${border}`, color: muted,
              fontSize:9, letterSpacing:"0.14em", padding:"3px 8px",
              cursor:"pointer", borderRadius:1, fontFamily:"'DM Mono',monospace",
            }}>✕ FERMER</button>
          </div>
          <h2 style={{ margin:"10px 0 0", fontSize:24, lineHeight:1.1,
            letterSpacing:"-0.025em", fontStyle:"italic", color: text }}>
            {work.title}
          </h2>
          <div style={{ marginTop:6, fontSize:14, color: muted }}>{work.artist}</div>
          {work.year && (
            <div style={{ marginTop:3, fontSize:11, color: muted,
              fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em" }}>
              {work.year}
            </div>
          )}
        </div>

        {/* Score bar */}
        <div style={{ padding:"16px 20px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5,
            fontSize:9, color: muted, fontFamily:"'DM Mono',monospace",
            letterSpacing:"0.12em", textTransform:"uppercase" }}>
            <span>Score OSR estimé</span>
            <span style={{ color: col, fontWeight:500, fontSize:11 }}>{score.toFixed(1)}</span>
          </div>
          <div style={{ height:1, background: trackBg, position:"relative" }}>
            <div style={{ position:"absolute", left:0, top:0, height:"100%",
              width:`${scorePct}%`, background: col, transition:"width 0.6s ease" }} />
          </div>
        </div>

        {/* Grille données mock */}
        <div style={{ padding:"14px 20px 0",
          display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {dims.map(({ label, value, unit, highlight, color: c }) => (
            <div key={label} style={{ padding:"9px 10px",
              border:`1px solid ${border}`, borderRadius:1 }}>
              <div style={{ fontSize:9, letterSpacing:"0.11em", textTransform:"uppercase",
                color: muted, marginBottom:4, fontFamily:"'DM Mono',monospace" }}>{label}</div>
              <div style={{
                fontSize: highlight ? 16 : 13,
                fontWeight: highlight ? 500 : 400,
                color: c || (highlight ? col : text),
                fontFamily: typeof value === "number" || !isNaN(value) ? "'DM Mono',monospace" : "inherit",
              }}>
                {value}{unit && <span style={{ fontSize:9, opacity:0.55, marginLeft:1 }}>{unit}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Verdict mock */}
        <div style={{ margin:"16px 20px 0", padding:"12px 14px",
          borderLeft:`2px solid ${col}`, background: trackBg }}>
          <div style={{ fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase",
            color: muted, fontFamily:"'DM Mono',monospace", marginBottom:6 }}>
            Aperçu structural
          </div>
          <div style={{ fontSize:13, color: text, lineHeight:1.65, fontStyle:"italic" }}>
            {verdict}
          </div>
        </div>

        {/* Notice "à venir" */}
        <div style={{ margin:"14px 20px 20px", padding:"11px 14px",
          border:`1px solid ${border}`, borderRadius:1,
          display:"flex", alignItems:"flex-start", gap:10 }}>
          <span style={{ fontSize:14, opacity:0.5, flexShrink:0 }}>◌</span>
          <div>
            <div style={{ fontSize:11, color: text, lineHeight:1.6 }}>
              L'analyse LISN complète — verdict éditorial, scores dimensionnels,
              worldview OSR — sera disponible dès que cette œuvre sera analysée.
            </div>
            <div style={{ fontSize:10, color: muted, marginTop:5,
              fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em" }}>
              Les données actuelles sont des estimations mock.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
