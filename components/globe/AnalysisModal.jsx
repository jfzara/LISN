"use client";

/**
 * AnalysisModal v2 — Teaser paywall élégant
 *
 * Vision : le contenu est LÀ, visible à moitié.
 * Pas de cadenas, pas de popup agressif.
 * Le texte se grise doucement. Le CTA est une invitation, pas une barrière.
 * Comme lire un article fascinant qui s'estompe après le premier paragraphe.
 */

const BIOME_COLOR = {
  dense:"#FF6B2F", atmospheric:"#4ABFFF", structural:"#E8C97A",
  narrative:"#FF9A4D", hybrid:"#C07AE8",
};
const BIOME_LABEL = {
  fr:{ dense:"Dense", atmospheric:"Atmosphérique", structural:"Structurel", narrative:"Narratif", hybrid:"Hybride" },
  en:{ dense:"Dense", atmospheric:"Atmospheric",   structural:"Structural", narrative:"Narrative", hybrid:"Hybrid"  },
};
const ROLE_LABEL = {
  fr:{ capital:"Capitale", city:"Ville", village:"Village", bridge:"Pont", island:"Île", hamlet:"Hameau" },
  en:{ capital:"Capital",  city:"City",  village:"Village", bridge:"Bridge", island:"Island", hamlet:"Hamlet" },
};

// Verdicts mock par biome — qualitatifs, qui donnent envie d'en savoir plus
const MOCK_VERDICTS = {
  fr:{
    dense:       "Une architecture sous pression. Chaque élément tient les autres en tension — retirer quoi que ce soit ferait s'effondrer l'ensemble.",
    atmospheric: "Le son précède la forme. Ici, le timbre n'illustre pas — il constitue. Une œuvre qui ne se laisse pas résumer.",
    structural:  "La contrainte comme libération. La rigueur formelle n'étouffe pas l'expression — elle la rend possible.",
    narrative:   "Le flux verbal sculpte l'espace sonore. Ce n'est pas de la musique avec des paroles — c'est une architecture où les mots sont des matériaux.",
    hybrid:      "Plusieurs grammaires en coexistence instable. L'œuvre invente ses règles au fur et à mesure qu'elle les transgresse.",
  },
  en:{
    dense:       "An architecture under pressure. Every element holds the others in tension — remove anything and the whole collapses.",
    atmospheric: "Sound precedes form. Here, timbre doesn't illustrate — it constitutes. A work that resists summary.",
    structural:  "Constraint as liberation. Formal rigour doesn't stifle expression — it makes it possible.",
    narrative:   "Verbal flow sculpts sonic space. This isn't music with words — it's an architecture where language is a material.",
    hybrid:      "Multiple grammars in unstable coexistence. The work invents its rules as it transgresses them.",
  },
};

// Texte "sous le voile" — ce qu'on voit flouter
const MOCK_DEEP = {
  fr:{
    dense:       "La densité n'est pas ici synonyme de surcharge. Il s'agit d'une économie de moyens poussée à son maximum expressif — chaque silence est calculé, chaque texture porte le poids de l'ensemble. Le worldview sous-jacent trahit une vision du monde où la résolution n'est jamais acquise, où la tension est un état permanent plutôt qu'une étape vers l'apaisement.",
    atmospheric: "Ce que cette œuvre accomplit structuralement est rare : elle installe une forme d'attention particulière chez l'auditeur, une écoute suspendue. Le worldview implicit révèle une ontologie du flou — non comme échec de définition, mais comme mode d'être supérieur à la clarté.",
    structural:  "L'architecture formelle de cette œuvre révèle une confiance absolue dans la structure comme vecteur d'émotion. Le worldview sous-jacent est celui d'un artiste qui croit que la rigueur ne s'oppose pas à la sensibilité — qu'au contraire, la contrainte est ce qui rend l'émotion supportable.",
    narrative:   "Le positionnement subjectif dans cette œuvre est d'une précision rare. La voix narratrice ne se contente pas de raconter — elle cartographie une expérience intérieure avec des outils sonores. Le worldview révèle une vision du langage non comme communication mais comme construction de réalité.",
    hybrid:      "Cette œuvre refuse l'appartenance. Elle emprunte sans s'identifier, transgresse sans détruire. Le worldview sous-jacent est celui d'un sujet en tension permanente entre plusieurs héritages — ce qui produit une énergie structurale rare, celle du non-lieu habité.",
  },
  en:{
    dense:       "Density here isn't synonymous with overload. This is an economy of means pushed to its maximum expressive limit — every silence is calculated, every texture carries the weight of the whole. The underlying worldview reveals a vision where resolution is never given, where tension is a permanent state rather than a step toward calm.",
    atmospheric: "What this work achieves structurally is rare: it installs a particular mode of attention in the listener, a suspended listening. The implicit worldview reveals an ontology of blur — not as failure of definition, but as a mode of being superior to clarity.",
    structural:  "The formal architecture reveals absolute confidence in structure as a vector of emotion. The underlying worldview is that of an artist who believes rigour doesn't oppose sensitivity — that constraint is precisely what makes emotion bearable.",
    narrative:   "The subjective positioning in this work is unusually precise. The narrative voice doesn't just tell — it maps an interior experience with sonic tools. The worldview reveals a vision of language not as communication but as reality-construction.",
    hybrid:      "This work refuses belonging. It borrows without identifying, transgresses without destroying. The underlying worldview is that of a subject in permanent tension between several inheritances — producing a rare structural energy, that of the inhabited non-place.",
  },
};

const UI = {
  fr:{
    badge: "Analyse LISN",
    close: "✕",
    estimated: "Score estimé",
    structPreview: "Aperçu structurel",
    deepTitle: "Analyse complète",
    worldviewTitle: "Worldview OSR",
    unlockTitle: "Débloquer l'analyse complète",
    unlockDesc: "Verdict éditorial complet, worldview OSR, scores dimensionnels, recommandations personnalisées.",
    unlockBtn: "Accéder à LISN Pro →",
    unlockNote: "Ou analyser cette œuvre en",
    analyseLink: "mode analyse →",
    teaser: "Ce que vous voyez n'est qu'un aperçu.",
    dimLabels:{ score:"Score global", intensity:"Intensité", exploration:"Exploration",
                zone:"Zone", role:"Rôle", type:"Type" },
    types:{ album:"Album", artist:"Artiste", track:"Morceau" },
  },
  en:{
    badge: "LISN Analysis",
    close: "✕",
    estimated: "Estimated score",
    structPreview: "Structural preview",
    deepTitle: "Full analysis",
    worldviewTitle: "OSR Worldview",
    unlockTitle: "Unlock the full analysis",
    unlockDesc: "Complete editorial verdict, OSR worldview, dimensional scores, personalised recommendations.",
    unlockBtn: "Get LISN Pro →",
    unlockNote: "Or analyse this work in",
    analyseLink: "analysis mode →",
    teaser: "What you see is only a preview.",
    dimLabels:{ score:"Global score", intensity:"Intensity", exploration:"Exploration",
                zone:"Zone", role:"Role", type:"Type" },
    types:{ album:"Album", artist:"Artist", track:"Track" },
  },
};

export default function AnalysisModal({ work, dark, lang = "fr", onClose }) {
  if (!work) return null;

  const M   = UI[lang] || UI.fr;
  const BL  = BIOME_LABEL[lang] || BIOME_LABEL.fr;
  const RL  = ROLE_LABEL[lang]  || ROLE_LABEL.fr;
  const biome   = work.biome || work.regime;
  const col     = BIOME_COLOR[biome] || "#e8dfc8";
  const verdict = (MOCK_VERDICTS[lang] || MOCK_VERDICTS.fr)[biome] || "";
  const deep    = (MOCK_DEEP[lang]    || MOCK_DEEP.fr)[biome]    || "";

  const bg    = dark ? "rgba(5,4,3,0.98)"      : "rgba(237,230,220,0.98)";
  const text  = dark ? "#f2ead8"               : "#120e0a";
  const muted = dark ? "#9c8e7e"               : "#5c5048";
  const bord  = dark ? "rgba(242,234,216,0.12)": "rgba(18,14,10,0.14)";
  const trackBg = dark ? "rgba(242,234,216,0.07)" : "rgba(18,14,10,0.07)";

  const score   = Number(work.score || 0);
  const scorePct = Math.round((score / 10) * 100);
  const intensity  = Math.min(99, Math.round(score * 8.5));
  const exploration = Math.min(99, Math.round(score * 7.8));

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      display:"flex", alignItems:"center", justifyContent:"center",
      background: dark ? "rgba(0,0,0,0.78)" : "rgba(100,90,80,0.50)",
      backdropFilter:"blur(6px)",
      fontFamily:"'Libre Baskerville', Georgia, serif",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        width:"min(480px, calc(100vw - 24px))",
        maxHeight:"90vh", overflowY:"auto",
        background: bg, borderRadius:1,
        position:"relative",
        boxShadow: dark
          ? `0 0 60px rgba(0,0,0,0.8), 0 0 0 1px ${col}44`
          : `0 0 40px rgba(0,0,0,0.15), 0 0 0 1px ${col}66`,
      }}>
        {/* Bande biome */}
        <div style={{ height:3, background: col }} />

        {/* Header */}
        <div style={{ padding:"16px 18px 0",
          display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase",
              color: col, fontFamily:"'DM Mono',monospace", marginBottom:6 }}>
              {M.badge}
            </div>
            <h2 style={{ margin:0, fontSize:22, lineHeight:1.1,
              letterSpacing:"-0.025em", fontStyle:"italic", color: text }}>
              {work.title}
            </h2>
            <div style={{ marginTop:5, fontSize:13, color: muted }}>
              {work.artist}
              {work.year && <span style={{ marginLeft:8, opacity:0.5 }}>{work.year}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"none", border:`1px solid ${bord}`, color: muted,
            fontSize:9, padding:"4px 8px", cursor:"pointer", borderRadius:1,
            fontFamily:"'DM Mono',monospace",
          }}>{M.close}</button>
        </div>

        {/* Score bar */}
        <div style={{ padding:"14px 18px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5,
            fontSize:9, color: muted, fontFamily:"'DM Mono',monospace",
            letterSpacing:"0.12em", textTransform:"uppercase" }}>
            <span>{M.estimated}</span>
            <span style={{ color: col, fontWeight:500, fontSize:13 }}>{score.toFixed(1)}</span>
          </div>
          <div style={{ height:1, background: trackBg, position:"relative" }}>
            <div style={{ position:"absolute", left:0, top:0, height:"100%",
              width:`${scorePct}%`, background: col, transition:"width 0.6s ease" }} />
          </div>
        </div>

        {/* Méta — scores dimensionnels visibles */}
        <div style={{ padding:"12px 18px 0",
          display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
          {[
            { label: M.dimLabels.score,     value: score.toFixed(1), unit:"/10", highlight: true },
            { label: M.dimLabels.intensity,  value: intensity,         unit:"/100" },
            { label: M.dimLabels.exploration,value: exploration,       unit:"/100" },
            { label: M.dimLabels.zone,       value: BL[biome] || biome || "—", color: col },
            { label: M.dimLabels.role,       value: RL[work.role] || work.role || "—" },
            { label: M.dimLabels.type,       value: M.types[work.entityType] || "—" },
          ].map(({ label, value, unit, highlight, color: c }) => (
            <div key={label} style={{ padding:"8px 10px",
              border:`1px solid ${bord}`, borderRadius:1 }}>
              <div style={{ fontSize:9, letterSpacing:"0.10em", textTransform:"uppercase",
                color: muted, marginBottom:3, fontFamily:"'DM Mono',monospace" }}>{label}</div>
              <div style={{
                fontSize: highlight ? 15 : 12, fontWeight: highlight ? 500 : 400,
                color: c || (highlight ? col : text),
                fontFamily: typeof value === "number" || !isNaN(value) ? "'DM Mono',monospace" : "inherit",
              }}>
                {value}
                {unit && <span style={{ fontSize:8, opacity:0.5, marginLeft:1 }}>{unit}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Verdict — visible, accrocheur */}
        <div style={{ margin:"14px 18px 0", padding:"12px 14px",
          borderLeft:`2px solid ${col}`, background: trackBg }}>
          <div style={{ fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase",
            color: muted, fontFamily:"'DM Mono',monospace", marginBottom:6 }}>
            {M.structPreview}
          </div>
          <div style={{ fontSize:13, color: text, lineHeight:1.75, fontStyle:"italic" }}>
            {verdict}
          </div>
        </div>

        {/* Zone paywall — contenu qui se grise */}
        <div style={{ position:"relative", margin:"0 18px", overflow:"hidden" }}>
          {/* Contenu flouté */}
          <div style={{
            filter:"blur(3.5px)",
            opacity:0.45,
            userSelect:"none",
            pointerEvents:"none",
          }}>
            {/* Analyse profonde */}
            <div style={{ marginTop:14, padding:"12px 14px",
              borderLeft:`2px solid ${bord}`, background: trackBg }}>
              <div style={{ fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase",
                color: muted, fontFamily:"'DM Mono',monospace", marginBottom:6 }}>
                {M.deepTitle}
              </div>
              <div style={{ fontSize:12, color: text, lineHeight:1.8 }}>
                {deep}
              </div>
            </div>
            {/* Worldview */}
            <div style={{ marginTop:10, padding:"12px 14px",
              border:`1px solid ${bord}`, borderRadius:1 }}>
              <div style={{ fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase",
                color: muted, fontFamily:"'DM Mono',monospace", marginBottom:6 }}>
                {M.worldviewTitle}
              </div>
              <div style={{ fontSize:12, color: text, lineHeight:1.8,
                fontFamily:"'DM Mono',monospace", letterSpacing:"0.04em" }}>
                A·0.72 — V·0.85 — S·0.61
              </div>
              <div style={{ fontSize:11, color: muted, marginTop:6, lineHeight:1.7 }}>
                {lang === "fr"
                  ? "Vision du monde implicite dans les choix sonores — tension non résolue, affirmation, résistance."
                  : "Worldview implicit in sonic choices — unresolved tension, affirmation, resistance."}
              </div>
            </div>
            {/* Scores dimensionnels détaillés */}
            <div style={{ marginTop:10, display:"grid",
              gridTemplateColumns:"1fr 1fr", gap:7 }}>
              {["Densité","Tension","Résolution","Singularité","Profondeur","Grain"].map(d => (
                <div key={d} style={{ padding:"7px 10px",
                  border:`1px solid ${bord}`, borderRadius:1 }}>
                  <div style={{ fontSize:9, color: muted, marginBottom:2,
                    fontFamily:"'DM Mono',monospace" }}>{d}</div>
                  <div style={{ height:1, background: trackBg, position:"relative" }}>
                    <div style={{ position:"absolute", left:0, top:0, height:"100%",
                      width:`${Math.round(50 + Math.random()*40)}%`,
                      background: col, opacity:0.7 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gradient de fondu */}
          <div style={{
            position:"absolute", top:0, left:0, right:0, height:"40%",
            background: dark
              ? "linear-gradient(to bottom, transparent, rgba(5,4,3,0))"
              : "linear-gradient(to bottom, transparent, rgba(237,230,220,0))",
            pointerEvents:"none",
          }} />
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, height:"70%",
            background: dark
              ? `linear-gradient(to bottom, transparent, ${bg} 70%)`
              : `linear-gradient(to bottom, transparent, ${bg} 70%)`,
            pointerEvents:"none",
          }} />

          {/* CTA paywall — centré sur la zone flouée */}
          <div style={{
            position:"absolute", bottom:16, left:0, right:0,
            display:"flex", flexDirection:"column", alignItems:"center", gap:10,
            zIndex:2,
          }}>
            <div style={{ fontSize:10, color: muted, fontFamily:"'DM Mono',monospace",
              letterSpacing:"0.12em", textTransform:"uppercase", opacity:0.8 }}>
              {M.teaser}
            </div>
            <button style={{
              padding:"11px 22px",
              background: col,
              border:"none",
              borderRadius:1,
              color: dark ? "#080604" : "#ffffff",
              fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase",
              cursor:"pointer",
              fontFamily:"'DM Mono',monospace",
              fontWeight:500,
              boxShadow: `0 0 24px ${col}66`,
              transition:"all 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              {M.unlockBtn}
            </button>
            <div style={{ fontSize:9, color: muted, opacity:0.6,
              fontFamily:"'DM Mono',monospace", letterSpacing:"0.08em" }}>
              {M.unlockDesc}
            </div>
          </div>
        </div>

        {/* Spacer pour le CTA */}
        <div style={{ height:130 }} />
      </div>
    </div>
  );
}
