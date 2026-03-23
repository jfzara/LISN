"use client";
// /app/page.jsx — LISN v3.4

import { useState, useRef, useEffect, useCallback } from "react";
import LisnWordmark from "@/components/lisn/LisnWordmark";

// ─── I18N ─────────────────────────────────────────────────────────────────────
const T = {
  fr: {
    analyser:"Analyser", analyse_en_cours:"Analyse en cours",
    rapide:"Rapide", approfondi:"Deep",
    track:"Morceau", album:"Album", artist:"Artiste",
    verdict:"Verdict", lecture_courte:"Lecture courte",
    regime_track:"Régime structurel", regime_album:"Régime de l'album", regime_artist:"Trajectoire",
    dimensions:"Dimensions structurelles",
    lecture:"Lecture structurale",
    longevity:"Longévité & influence",
    vision:"Vision du monde", fonction:"Fonction psychologique", analyse_app:"Analyse approfondie",
    discuter:"Discuter", contester:"Contester", comparer:"Comparer",
    autre:"Autre objection", envoyer:"Envoyer",
    placeholder_search_track:"Artiste — Titre du morceau…",
    placeholder_search_album:"Artiste — Titre de l'album…",
    placeholder_search_artist:"Nom de l'artiste ou groupe…",
    placeholder_discuss:"Votre message…",
    comparer_a:"A", comparer_b:"B",
    compare_go:"Comparer", compare_loading:"Analyse en cours…",
    objection_label:"Votre note", indice:"Score structural",
    aucune_pochette:"Aucune pochette",
    osr_cta:"En savoir plus →", osr_close:"Fermer",
    osr_behind:"Derrière LISN · OSR",
    analyser_une:"Analyser",
    discuss_intro:"Posez vos questions, contestez le score, exprimez votre point de vue.",
    contest_hint:"Ajustez les curseurs selon votre lecture — LISN comparera et répondra.",
    contest_submit:"Soumettre ma lecture",
    contest_reset:"Réinitialiser",
    influence_genre:"Influence sur le genre",
    cultural_refs:"Références culturelles",
    citations_by:"Cité par d'autres artistes",
    charts:"Présence dans les charts",
    album_quality:"Qualité globale", album_cohesion:"Cohésion",
    album_ambition:"Ambition réalisée",
    album_peaks:"Points forts", album_weak:"Points faibles",
    artist_quality:"Qualité discographique", artist_consistency:"Constance",
    artist_exploration:"Exploration", artist_cultural:"Poids culturel",
    artist_trajectory:"Trajectoire", artist_influence:"Influence",
    artist_best:"Œuvres majeures", artist_phases:"Phases de carrière",
    source_sample:"Contient un sample de", source_reprise:"Reprise de",
    source_inter:"Interpolation de", source_template:"Inspiré de",
    lisn_score:"Score LISN", your_score:"Votre score",
    diff:"Écart",
    glossaire:"Glossaire",
    glossaire_close:"Fermer",
    score_anchor_85:"Étendu l'espace des formes",
    score_anchor_65:"Structure sérieuse, exploration réelle",
    score_anchor_45:"Compétent, dans les formules",
    score_anchor_25:"Formule bien exécutée",
    score_anchor_0:"Pas d'identité structurelle",
    suggestions_title:"Et si vous écoutiez…",
    suggestions_high:"Très haute structure",
    suggestions_low:"Très faible structure",
    suggestions_explore:"Explorer",
  },
  en: {
    analyser:"Analyze", analyse_en_cours:"Analyzing",
    rapide:"Quick", approfondi:"Deep",
    track:"Track", album:"Album", artist:"Artist",
    verdict:"Verdict", lecture_courte:"Short read",
    regime_track:"Structural regime", regime_album:"Album regime", regime_artist:"Trajectory",
    dimensions:"Structural dimensions",
    lecture:"Structural reading",
    longevity:"Longevity & influence",
    vision:"Worldview", fonction:"Psychological function", analyse_app:"Full analysis",
    discuter:"Discuss", contester:"Contest", comparer:"Compare",
    autre:"Another objection", envoyer:"Send",
    placeholder_search_track:"Artist — Track title…",
    placeholder_search_album:"Artist — Album title…",
    placeholder_search_artist:"Artist or band name…",
    placeholder_discuss:"Your message…",
    comparer_a:"A", comparer_b:"B",
    compare_go:"Compare", compare_loading:"Analyzing…",
    objection_label:"Your score", indice:"Structural score",
    aucune_pochette:"No cover",
    osr_cta:"Learn more →", osr_close:"Close",
    osr_behind:"Behind LISN · OSR",
    analyser_une:"Analyze",
    discuss_intro:"Ask questions, challenge the score, share your reading.",
    contest_hint:"Adjust the sliders to reflect your own reading — LISN will compare and respond.",
    contest_submit:"Submit my reading",
    contest_reset:"Reset",
    influence_genre:"Influence on genre",
    cultural_refs:"Cultural references",
    citations_by:"Cited by other artists",
    charts:"Chart presence",
    album_quality:"Overall quality", album_cohesion:"Cohesion",
    album_ambition:"Ambition realized",
    album_peaks:"Highlights", album_weak:"Weak points",
    artist_quality:"Discographic quality", artist_consistency:"Consistency",
    artist_exploration:"Exploration", artist_cultural:"Cultural weight",
    artist_trajectory:"Trajectory", artist_influence:"Influence",
    artist_best:"Major works", artist_phases:"Career phases",
    source_sample:"Contains a sample from", source_reprise:"Cover of",
    source_inter:"Interpolation from", source_template:"Structurally inspired by",
    lisn_score:"LISN score", your_score:"Your score",
    diff:"Diff",
    glossaire:"Glossary",
    glossaire_close:"Close",
    score_anchor_85:"Extended the space of forms",
    score_anchor_65:"Serious structure, real exploration",
    score_anchor_45:"Competent, operates in formulas",
    score_anchor_25:"Formula well executed",
    score_anchor_0:"No structural identity",
    suggestions_title:"What if you listened to…",
    suggestions_high:"High structure",
    suggestions_low:"Low structure",
    suggestions_explore:"Explore",
  }
};

// ─── DIM CONFIG ───────────────────────────────────────────────────────────────
const DIMS = {
  fr: {
    density:    { label:"Densité",     plain:"Nombre de vraies décisions",    hint:"La densité des choix compositionnels réels." },
    tension:    { label:"Tension",     plain:"Maintien de l'intensité",       hint:"Le niveau de tension interne maintenu." },
    resolution: { label:"Résolution",  plain:"Comment la tension se résout",  hint:"Peut être délibérément basse — c'est un choix." },
    singularity:{ label:"Singularité", plain:"Ce que seule elle fait",        hint:"Ce qui résiste à la substitution." },
    depth:      { label:"Profondeur",  plain:"Niveaux de lecture",            hint:"La capacité à survivre à la répétition." },
    grain:      { label:"Grain",       plain:"Texture sonore propre",         hint:"La matière sonore distinctive." },
    resistance: { label:"Résistance",  plain:"Tient si on enlève un élément", hint:"La robustesse de la structure." },
  },
  en: {
    density:    { label:"Density",     plain:"Real musical choices",          hint:"The density of actual compositional decisions." },
    tension:    { label:"Tension",     plain:"Intensity maintenance",         hint:"The level of internal tension sustained." },
    resolution: { label:"Resolution",  plain:"How tension resolves",          hint:"Can be deliberately low — that's a choice." },
    singularity:{ label:"Singularity", plain:"What only it does",             hint:"Resistance to substitution." },
    depth:      { label:"Depth",       plain:"Layers of meaning",             hint:"Capacity to survive repetition." },
    grain:      { label:"Grain",       plain:"Distinctive texture",           hint:"The distinctive sonic material." },
    resistance: { label:"Resistance",  plain:"Holds if you remove something", hint:"Structural robustness." },
  }
};

const DIM_KEYS = ["density","tension","resolution","singularity","depth","grain","resistance"];

const OSR_BLOCKS = {
  fr: [
    { title:"Qu'est-ce que l'OSR ?", body:"Une ontologie — un système philosophique — qui décrit le réel comme un espace de structures sous contraintes. Chaque œuvre, chaque artiste, chaque auditeur est une configuration qui tient ou qui ne tient pas. Ce qui résiste dans le temps révèle quelque chose de structurellement vrai." },
    { title:"Pourquoi la musique ?", body:"Une œuvre musicale est une configuration structurelle mesurable — pas selon l'humeur ou la mode, mais selon des critères objectifs : cohérence interne, résistance à la réduction, profondeur. LISN applique ces critères de façon rigoureuse et reproductible." },
    { title:"Tout le monde juge déjà", body:"Le relativisme musical (\"chacun son truc\") n'est pas l'absence de jugement — c'est un jugement qui n'ose pas s'avouer. Poli, socialement sûr, largement creux. LISN ne crée pas la hiérarchie : il la rend explicite, argumentée, et donc vraiment discutable." },
    { title:"Au-delà du subjectif", body:"LISN ne remplace pas votre écoute. Il lui donne un langage. Au lieu de \"j'aime\" ou \"je n'aime pas\", vous pouvez maintenant dire pourquoi — avec des arguments que vous pouvez défendre, contester, et affiner. C'est ça, une vraie conversation sur la musique." },
  ],
  en: [
    { title:"What is OSR?", body:"An ontology — a philosophical system — describing reality as a space of structures under constraints. Every work, every artist, every listener is a configuration that either holds or doesn't. What resists over time reveals something structurally true." },
    { title:"Why music?", body:"A musical work is a measurable structural configuration — not judged by mood or trend, but by objective criteria: internal coherence, resistance to reduction, depth of meaning. LISN applies these criteria rigorously and consistently." },
    { title:"Everyone already judges", body:"Musical relativism (\"to each their own\") is not the absence of judgment — it is a judgment that doesn't dare speak its name. Polite, socially safe, largely hollow. LISN doesn't create the hierarchy: it makes it explicit, argued, and therefore genuinely debatable." },
    { title:"Beyond the subjective", body:"LISN doesn't replace your listening. It gives it a language. Instead of \"I like it\" or \"I don't\", you can now say why — with arguments you can defend, contest, and refine. That's what a real conversation about music looks like." },
  ]
};

// ─── DEMO ─────────────────────────────────────────────────────────────────────
const DEMO = {
  entity: { type:"track", title:"A Milli", artist:"Lil Wayne", album:"Tha Carter III", year:"2008", label:"Cash Money" },
  verdict: { text:"Minimalisme tendu dont la rigidité fait toute la force — et la limite.", confidence:0.84 },
  score: { global:72, density:68, tension:65, resolution:40, singularity:75, depth:58, grain:70, resistance:80 },
  regime: { structureType:"Structure incarnée", compositionMode:"Sélection dans espace stabilisé", templateDependence:"Modérée", exploration:"Faible", constraintLevel:"Élevé", dominantFunction:"Stabilisation par performance" },
  badges:["Structure incarnée","Minimalisme contraint","Résistance élevée","Signature forte"],
  editorial:{ short:"Le morceau tient moins par richesse harmonique que par une contrainte rythmique et verbale extrêmement resserrée.", structural:"A Milli repose sur une économie structurelle sévère — peu d'éléments, mais une pression considérable exercée par le flow, la scansion, l'insistance." },
  deep:{ worldview:"Vision centrée sur la domination expressive.", psychologicalFunction:"Stabilisation par intensification — il concentre.", fullAnalysis:"" },
  longevity:{ score:82, influenceOnGenre:"A défini une esthétique du minimalisme trap.", culturalReferences:"Samplée dans des films, référencée dans des dizaines de freestyles.", citations:["Kendrick Lamar — Backseat Freestyle","Drake — Over My Dead Body"], chartsLongevity:"Top 10 US pendant 12 semaines." },
  sourceInfo:null, scoreCapsTriggered:[], albumAnalysis:null, artistAnalysis:null,
  meta:{ mode:"fast", analysisTime:1280, model:"demo" }
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const scoreClass = n => n >= 70 ? "hi" : n < 45 ? "lo" : "";

function scoreAnchor(n, t) {
  if (n >= 85) return t.score_anchor_85;
  if (n >= 65) return t.score_anchor_65;
  if (n >= 45) return t.score_anchor_45;
  if (n >= 25) return t.score_anchor_25;
  return t.score_anchor_0;
}
const dimClass   = n => n >= 68 ? "hi" : n <= 35 ? "lo" : "";

function deriveUserGlobal(userScores) {
  const w = { density:.15, tension:.15, resolution:.10, singularity:.20, depth:.15, grain:.10, resistance:.15 };
  return Math.round(DIM_KEYS.reduce((acc, k) => acc + (userScores[k] ?? 50) * (w[k] || 0), 0));
}

// ── Image resolution strategy:
// Artists  → Wikipedia thumbnail (free, no key, reliable)
// Tracks   → MusicBrainz + Cover Art Archive
// Albums   → MusicBrainz + Cover Art Archive
async function fetchCoverUrl(artist, title, album, entityType) {
  if (!artist) return null;
  try {
    if (entityType === "artist") {
      // Wikipedia / Wikimedia: search for artist page, get thumbnail
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist)}`;
      const res = await fetch(searchUrl, { headers:{"User-Agent":"LISN/3.4"} });
      if (res.ok) {
        const data = await res.json();
        const img = data?.thumbnail?.source || data?.originalimage?.source;
        if (img) return img;
      }
      // Fallback: search Wikipedia
      const search = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(artist)}&prop=pageimages&format=json&pithumbsize=300&origin=*`
      );
      if (search.ok) {
        const sd = await search.json();
        const pages = Object.values(sd?.query?.pages || {});
        const thumb = pages[0]?.thumbnail?.source;
        if (thumb) return thumb;
      }
      return null;
    }
    // Tracks/Albums → Cover Art Archive via MusicBrainz
    const q = album
      ? `release:"${encodeURIComponent(album)}" AND artist:"${encodeURIComponent(artist)}"`
      : `recording:"${encodeURIComponent(title)}" AND artist:"${encodeURIComponent(artist)}"`;
    const res = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=${q}&limit=3&fmt=json`,
      { headers:{"User-Agent":"LISN/3.4"} }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Try each release until we find cover art
    for (const release of (data?.releases || [])) {
      const mbid = release?.id;
      if (!mbid) continue;
      const head = await fetch(`https://coverartarchive.org/release/${mbid}/front-250`, { method:"HEAD" });
      if (head.ok) return `https://coverartarchive.org/release/${mbid}/front-250`;
    }
    return null;
  } catch { return null; }
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function Orb() { return <div className="lisn-orb" />; }

function CoverImage({ artist, title, album, t, entityType }) {
  const [src, setSrc] = useState(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!artist) { setDone(true); return; }
    setSrc(null); setDone(false);
    fetchCoverUrl(artist, title, album, entityType).then(u => { setSrc(u); setDone(true); });
  }, [artist, title, album, entityType]);
  return (
    <div className="lisn-cover">
      {src && (
        <img
          src={src}
          alt=""
          className="lisn-cover-img"
          loading="eager"
          onError={() => { setSrc(null); setDone(true); }}
        />
      )}
      {(!src) && (
        <div className={`lisn-cover-ph ${!done ? "loading" : ""}`}>
          {!done
            ? <span className="lisn-cover-ph-pulse" />
            : <>
                <span className="lisn-cover-ph-icon">♪</span>
                <span className="lisn-cover-ph-text">{t.aucune_pochette}</span>
              </>
          }
        </div>
      )}
    </div>
  );
}

function SourceNote({ sourceInfo, t }) {
  if (!sourceInfo?.type || !sourceInfo?.reference) return null;
  const map = { sample:t.source_sample, reprise:t.source_reprise, interpolation:t.source_inter, template:t.source_template };
  return (
    <div className="lisn-source-note">
      <span className="lisn-source-note-dot" />
      {map[sourceInfo.type] || sourceInfo.type} <strong>{sourceInfo.reference}</strong>
    </div>
  );
}

// ─── CITATION LINK ────────────────────────────────────────────────────────────
// Parses "Artist — Track (Year)" or "Artist Name" and makes it clickable
function ErrorSuggestion({ error, entityType, lang, setEntityType, analyse, t }) {
  if (!error) return null;
  const isFr = lang === "fr";

  const isJsonTruncation = error.includes("Unterminated") || error.includes("position") ||
    (error.includes("JSON") && !error.includes("type"));

  if (isJsonTruncation) {
    const hint = isFr
      ? "Réponse trop longue. Réessayez ou passez en mode Rapide."
      : "Response too long. Retry or switch to Quick mode.";
    return (
      <div className="lisn-error-suggestion">
        <span className="lisn-error-hint">{hint}</span>
        <button className="lisn-error-switch" onClick={analyse}>
          {isFr ? "Réessayer →" : "Retry →"}
        </button>
      </div>
    );
  }

  return <p className="lisn-error">⚑ {error}</p>;
}

function CitationLink({ citation, onAnalyse }) {
  // Try to detect if it's "Artist — Track" or just "Artist"
  const hasDash = citation.includes(" — ") || citation.includes(" – ");
  const cleanText = citation.replace(/\s*\([^)]*\)\s*$/g, "").trim(); // remove (year)

  function handleClick() {
    if (!onAnalyse) return;
    // If "Artist — Track", extract artist part for artist analysis
    // If just artist name, do artist analysis
    const parts = cleanText.split(/\s*[—–]\s*/);
    const query = parts[0].trim(); // always use the artist name part
    const type = hasDash ? "track" : "artist";
    onAnalyse(query, type);
  }

  return (
    <div className="lisn-longevity-citation lisn-citation-link" onClick={handleClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && handleClick()}>
      <span className="lisn-source-note-dot" style={{display:"inline-block",marginRight:8,flexShrink:0}} />
      <span className="lisn-citation-text">{citation}</span>
      <span className="lisn-citation-arrow">→</span>
    </div>
  );
}

// ─── INTERACTIVE DIMENSIONS ───────────────────────────────────────────────────
// contestMode = false → read-only bars
// contestMode = true  → interactive sliders

const ARTIST_DIMS = {
  fr: {
    worldview:       { label:"Vision du monde",     plain:"L'œuvre dit-elle quelque chose du réel ?",      hint:"L'artiste exprime-t-il une façon cohérente de voir le monde à travers sa musique ?" },
    identity:        { label:"Identité propre",      plain:"Reconnaissable et irremplaçable",               hint:"Est-ce qu'on reconnaît cet artiste immédiatement ? Pourrait-on le confondre avec quelqu'un d'autre ?" },
    exploration:     { label:"Exploration",          plain:"A-t-il ouvert de nouveaux territoires ?",       hint:"A-t-il réellement inventé quelque chose, ou reproduit des formules existantes ?" },
    temporalDepth:   { label:"Profondeur temporelle",plain:"La musique tient-elle dans le temps ?",         hint:"Ses œuvres supportent-elles l'écoute répétée ? Valent-elles encore quelque chose en 2025 ?" },
    culturalFunction:{ label:"Fonction culturelle",  plain:"Quel rôle dans la culture musicale ?",          hint:"Créateur, codificateur de tendances, entertainer, suiveur de mode — où se situe-t-il ?" },
  },
  en: {
    worldview:       { label:"Worldview",            plain:"Does the work say something about reality?",    hint:"Does the artist express a coherent way of seeing the world through their music?" },
    identity:        { label:"Own identity",         plain:"Recognizable and irreplaceable",                hint:"Would you immediately recognize this artist? Could they be confused with someone else?" },
    exploration:     { label:"Exploration",          plain:"Did they open new territory?",                  hint:"Did they genuinely invent something, or reproduce existing formulas?" },
    temporalDepth:   { label:"Temporal depth",       plain:"Does the music hold up over time?",             hint:"Do their works reward repeated listening? Are they still worth something today?" },
    culturalFunction:{ label:"Cultural function",    plain:"What role in musical culture?",                 hint:"Creator, trend codifier, entertainer, trend follower — where do they sit?" },
  }
};
const ARTIST_DIM_KEYS = ["worldview","identity","exploration","temporalDepth","culturalFunction"];

function DimensionsBlock({ score, artistScores, lang, entityType, contestMode, userScores, onUserScoreChange }) {
  const [openHint, setOpenHint] = useState(null);
  const cfg = DIMS[lang];

  // Don't show dims if all zero (error/empty response)
  const allZero = DIM_KEYS.every(k => (score?.[k] ?? 0) === 0);
  const artistAllZero = ARTIST_DIM_KEYS.every(k => (artistScores?.[k] ?? 0) === 0);
  if (allZero && artistAllZero && !contestMode) return null;

  // Artist gets its own 5-dimension display
  if (entityType === "artist" && !contestMode) {
    const aDims = ARTIST_DIMS[lang];
    return (
      <div className="lisn-dims">
        <div className="lisn-label">{T[lang].dimensions}</div>
        {ARTIST_DIM_KEYS.map(k => {
          const v = artistScores?.[k] ?? 0;
          const isOpen = openHint === k;
          const { label, plain, hint } = aDims[k];
          return (
            <div key={k}>
              <div className="lisn-dim-row" onClick={() => setOpenHint(isOpen ? null : k)} role="button" tabIndex={0} onKeyDown={e => e.key==="Enter" && setOpenHint(isOpen?null:k)}>
                <span>
                  <span className="lisn-dim-name">{label}</span>
                  <span className="lisn-dim-plain">{plain}</span>
                </span>
                <div className="lisn-dim-track">
                  <div className={`lisn-dim-fill ${dimClass(v)}`} style={{ width:`${v}%` }} />
                </div>
                <span className="lisn-dim-score">{v}</span>
              </div>
              {isOpen && (
                <div className="lisn-dim-float-hint">
                  <span className="lisn-dim-float-text">{hint}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="lisn-dims">
      <div className="lisn-label">{T[lang].dimensions}</div>
      {DIM_KEYS.map(k => {
        const lisnVal  = score?.[k] ?? 0;
        const userVal  = userScores?.[k] ?? lisnVal;
        const isOpen   = openHint === k;
        const { label, plain, hint } = cfg[k];
        const diff     = userVal - lisnVal;

        return (
          <div key={k}>
            <div
              className={`lisn-dim-row ${contestMode ? "contest-mode" : ""}`}
              onClick={() => !contestMode && setOpenHint(isOpen ? null : k)}
              role={contestMode ? undefined : "button"}
              tabIndex={contestMode ? -1 : 0}
              onKeyDown={e => !contestMode && e.key === "Enter" && setOpenHint(isOpen ? null : k)}
            >
              <span>
                <span className="lisn-dim-name">{label}</span>
                <span className="lisn-dim-plain">{plain}</span>
              </span>

              {contestMode ? (
                /* SLIDER MODE */
                <div className="lisn-dim-slider-wrap">
                  {/* LISN ghost bar */}
                  <div className="lisn-dim-ghost-bar">
                    <div className="lisn-dim-ghost-fill" style={{ width:`${lisnVal}%` }} />
                  </div>
                  {/* User slider */}
                  <input
                    type="range" min={0} max={100} step={1}
                    value={userVal}
                    className="lisn-dim-slider"
                    onChange={e => onUserScoreChange(k, Number(e.target.value))}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              ) : (
                /* BAR MODE */
                <div className="lisn-dim-track">
                  <div className={`lisn-dim-fill ${dimClass(lisnVal)}`} style={{ width:`${lisnVal}%` }} />
                </div>
              )}

              <div className="lisn-dim-scores-col">
                {contestMode ? (
                  <>
                    <span className="lisn-dim-score">{userVal}</span>
                    {diff !== 0 && (
                      <span className={`lisn-dim-diff ${diff > 0 ? "pos" : "neg"}`}>
                        {diff > 0 ? "+" : ""}{diff}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="lisn-dim-score">{lisnVal}</span>
                )}
              </div>
            </div>
            {!contestMode && isOpen && (
              <div className="lisn-dim-float-hint">
                <span className="lisn-dim-float-text">{hint}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Global comparison when in contest mode */}
      {contestMode && userScores && (
        <div className="lisn-dim-global-compare">
          <span className="lisn-dim-compare-label">{T[lang].lisn_score}</span>
          <span className="lisn-dim-compare-val">{score?.global ?? 0}</span>
          <span className="lisn-dim-compare-vs">vs</span>
          <span className="lisn-dim-compare-label">{T[lang].your_score}</span>
          <span className={`lisn-dim-compare-val ${scoreClass(deriveUserGlobal(userScores))}`}>
            {deriveUserGlobal(userScores)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── REGIME BLOCK ─────────────────────────────────────────────────────────────
function RegimeBlock({ regime, lang, entityType }) {
  if (!regime) return null;
  const t = T[lang];
  const label = entityType==="album" ? t.regime_album : entityType==="artist" ? t.regime_artist : t.regime_track;
  const isEn = lang === "en";

  let rows = [];
  if (entityType === "artist") {
    rows = [
      [isEn?"Trajectory":"Trajectoire", regime.trajectory],
      [isEn?"Exploration level":"Niveau d'exploration", regime.explorationLevel],
      [isEn?"Consistency":"Constance", regime.consistency],
      [isEn?"Dominant function":"Fonction dominante", regime.dominantFunction],
      [isEn?"Period covered":"Période couverte", regime.periodCovered],
    ];
  } else if (entityType === "album") {
    rows = [
      [isEn?"Album type":"Type d'album", regime.albumType],
      [isEn?"Compositional mode":"Mode compositionnel", regime.compositionMode],
      [isEn?"Template dependence":"Dépendance template", regime.templateDependence],
      [isEn?"Exploration":"Exploration", regime.exploration],
      [isEn?"Constraint level":"Niveau de contraintes", regime.constraintLevel],
      [isEn?"Dominant function":"Fonction dominante", regime.dominantFunction],
    ];
  } else {
    rows = [
      [isEn?"Structure type":"Type de structure", regime.structureType],
      [isEn?"Compositional mode":"Mode compositionnel", regime.compositionMode],
      [isEn?"Template dependence":"Dépendance template", regime.templateDependence],
      [isEn?"Exploration":"Exploration", regime.exploration],
      [isEn?"Constraint level":"Niveau de contraintes", regime.constraintLevel],
      [isEn?"Dominant function":"Fonction dominante", regime.dominantFunction],
    ];
  }

  const valid = rows.filter(([,v]) => v);
  if (!valid.length) return null;

  return (
    <div className="lisn-regime">
      <div className="lisn-label">{label}</div>
      <div className="lisn-regime-grid">
        {valid.map(([k,v]) => (
          <div key={k} className="lisn-regime-item">
            <div className="lisn-regime-key">{k}</div>
            <div className="lisn-regime-val">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LONGEVITY BLOCK ──────────────────────────────────────────────────────────
function LongevityBlock({ longevity, lang, onAnalyseCitation }) {
  if (!longevity || longevity.score === 0) return null;
  const t = T[lang];
  const s = longevity.score ?? 0;
  return (
    <div className="lisn-longevity">
      <div className="lisn-label">{t.longevity}</div>
      <div className="lisn-longevity-top">
        <div className="lisn-longevity-score-wrap">
          <span className={`lisn-longevity-num ${scoreClass(s)}`}>{s}</span>
          <span className="lisn-longevity-denom">/100</span>
        </div>
        <div className="lisn-longevity-facts">
          {longevity.influenceOnGenre && (
            <div className="lisn-longevity-fact">
              <div className="lisn-longevity-fact-key">{t.influence_genre}</div>
              <div className="lisn-longevity-fact-val">{longevity.influenceOnGenre}</div>
            </div>
          )}
          {longevity.culturalReferences && (
            <div className="lisn-longevity-fact">
              <div className="lisn-longevity-fact-key">{t.cultural_refs}</div>
              <div className="lisn-longevity-fact-val">{longevity.culturalReferences}</div>
            </div>
          )}
          {longevity.chartsLongevity && (
            <div className="lisn-longevity-fact">
              <div className="lisn-longevity-fact-key">{t.charts}</div>
              <div className="lisn-longevity-fact-val">{longevity.chartsLongevity}</div>
            </div>
          )}
        </div>
      </div>
      {longevity.citations?.length > 0 && (
        <div className="lisn-longevity-citations">
          <div className="lisn-longevity-fact-key" style={{marginBottom:10}}>{t.citations_by}</div>
          {longevity.citations.map((c,i) => (
            <CitationLink key={i} citation={c} onAnalyse={onAnalyseCitation} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ALBUM BLOCK ──────────────────────────────────────────────────────────────
function AlbumBlock({ albumAnalysis, lang }) {
  if (!albumAnalysis) return null;
  const t = T[lang];
  const metrics = [
    { key:t.album_quality,   val:albumAnalysis.overallQuality },
    { key:t.album_cohesion,  val:albumAnalysis.cohesion },
    { key:t.album_ambition,  val:albumAnalysis.ambitionRealizationScore },
  ].filter(m => m.val);

  return (
    <div className="lisn-album-analysis">
      <div className="lisn-label">{lang==="en"?"Album structure":"Structure de l'album"}</div>
      <div className="lisn-album-metrics">
        {metrics.map(m => (
          <div key={m.key} className="lisn-album-metric">
            <div className="lisn-album-metric-key">{m.key}</div>
            <div className="lisn-album-metric-bar">
              <div className={`lisn-dim-fill ${dimClass(m.val)}`} style={{width:`${m.val}%`,height:"100%",position:"absolute",left:0,top:0,transition:"width .7s cubic-bezier(.22,1,.36,1)"}} />
            </div>
            <div className="lisn-album-metric-val">{m.val}</div>
          </div>
        ))}
      </div>
      {albumAnalysis.ambitionRealizationText && <p className="lisn-album-note">{albumAnalysis.ambitionRealizationText}</p>}
      {albumAnalysis.trackQualityDistribution && <p className="lisn-album-note">{albumAnalysis.trackQualityDistribution}</p>}
      {albumAnalysis.peakTracks?.length > 0 && (
        <div className="lisn-tag-row">
          <span className="lisn-tag-label">{t.album_peaks}</span>
          {albumAnalysis.peakTracks.map((x,i) => <span key={i} className="lisn-tag lisn-tag-pos">{x}</span>)}
        </div>
      )}
      {albumAnalysis.weakPoints?.length > 0 && (
        <div className="lisn-tag-row">
          <span className="lisn-tag-label">{t.album_weak}</span>
          {albumAnalysis.weakPoints.map((x,i) => <span key={i} className="lisn-tag lisn-tag-neg">{x}</span>)}
        </div>
      )}
    </div>
  );
}

// ─── ARTIST BLOCK ─────────────────────────────────────────────────────────────
function ArtistBlock({ artistAnalysis, lang }) {
  if (!artistAnalysis) return null;
  const t = T[lang];
  const metrics = [
    { key:t.artist_quality,      val:artistAnalysis.overallQuality },
    { key:t.artist_consistency,  val:artistAnalysis.consistency },
    { key:t.artist_exploration,  val:artistAnalysis.explorationScore },
    { key:t.artist_cultural,     val:artistAnalysis.culturalWeight },
  ].filter(m => m.val);

  return (
    <div className="lisn-artist-analysis">
      <div className="lisn-label">{lang==="en"?"Artist metrics":"Métriques artiste"}</div>
      <div className="lisn-album-metrics">
        {metrics.map(m => (
          <div key={m.key} className="lisn-album-metric">
            <div className="lisn-album-metric-key">{m.key}</div>
            <div className="lisn-album-metric-bar">
              <div className={`lisn-dim-fill ${dimClass(m.val)}`} style={{width:`${m.val}%`,height:"100%",position:"absolute",left:0,top:0,transition:"width .7s cubic-bezier(.22,1,.36,1)"}} />
            </div>
            <div className="lisn-album-metric-val">{m.val}</div>
          </div>
        ))}
      </div>
      {artistAnalysis.trajectoryText && (
        <div className="lisn-artist-section">
          <div className="lisn-longevity-fact-key">{t.artist_trajectory}</div>
          <p className="lisn-album-note">{artistAnalysis.trajectoryText}</p>
        </div>
      )}
      {artistAnalysis.influenceText && (
        <div className="lisn-artist-section">
          <div className="lisn-longevity-fact-key">{t.artist_influence}</div>
          <p className="lisn-album-note">{artistAnalysis.influenceText}</p>
        </div>
      )}
      {artistAnalysis.bestWork?.length > 0 && (
        <div className="lisn-tag-row">
          <span className="lisn-tag-label">{t.artist_best}</span>
          {artistAnalysis.bestWork.map((x,i) => <span key={i} className="lisn-tag lisn-tag-pos">{x}</span>)}
        </div>
      )}
      {artistAnalysis.phases?.length > 0 && (
        <div className="lisn-artist-phases">
          <div className="lisn-longevity-fact-key" style={{marginBottom:12}}>{t.artist_phases}</div>
          {artistAnalysis.phases.map((p,i) => (
            <div key={i} className="lisn-phase-row">
              <div className="lisn-phase-period">{p.period}</div>
              <div>
                <div className="lisn-phase-label">{p.label}</div>
                {p.desc && <div className="lisn-phase-desc">{p.desc}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CONTEST PANEL ────────────────────────────────────────────────────────────
// This panel uses sliders embedded in the DimensionsBlock above.
// It shows the comparison table and LISN's response.

function ContestPanel({ data, lang, t, userScores, onReset }) {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const ctx = {
    title:data?.entity?.title, artist:data?.entity?.artist,
    score:data?.score, regime:data?.regime,
    badges:data?.badges, verdict:data?.verdict?.text,
    lang
  };

  async function submit() {
    const text = msg.trim() || (lang==="fr" ? "Voici ma lecture de cette œuvre." : "Here is my reading of this work.");
    setLoading(true); setResponse(null);
    try {
      const res = await fetch("/api/discuss", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ message:text, analysisContext:ctx, history:[], lang, userScores })
      });
      const j = await res.json();
      setResponse(j.reply || j.error);
    } catch { setResponse(lang==="fr" ? "Erreur de connexion." : "Connection error."); }
    finally { setLoading(false); }
  }

  const lisnGlobal = data?.score?.global ?? 0;
  const userGlobal = deriveUserGlobal(userScores);
  const diff = userGlobal - lisnGlobal;

  return (
    <div className="lisn-panel" style={{marginTop:0, borderTop:"none"}}>
      <div className="lisn-panel-head">{t.contester}</div>

      <p className="lisn-contest-note">{t.contest_hint}</p>

      {/* Score comparison summary */}
      <div className="lisn-contest-score-bar">
        <div className="lisn-contest-score-item">
          <span className="lisn-contest-score-key">{t.lisn_score}</span>
          <span className={`lisn-contest-score-val ${scoreClass(lisnGlobal)}`}>{lisnGlobal}</span>
        </div>
        <div className="lisn-contest-score-divider">
          {diff !== 0 && (
            <span className={`lisn-contest-diff ${diff > 0 ? "pos" : "neg"}`}>
              {diff > 0 ? "+" : ""}{diff}
            </span>
          )}
        </div>
        <div className="lisn-contest-score-item">
          <span className="lisn-contest-score-key">{t.your_score}</span>
          <span className={`lisn-contest-score-val ${scoreClass(userGlobal)}`}>{userGlobal}</span>
        </div>
      </div>

      {/* Optional message from user */}
      <div className="lisn-chat-form" style={{marginBottom:10}}>
        <textarea
          className="lisn-chat-input"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder={lang==="fr" ? "Expliquez votre lecture (facultatif)…" : "Explain your reading (optional)…"}
          rows={2}
        />
      </div>

      <div style={{display:"flex", gap:10, marginBottom:20}}>
        <button className="lisn-compare-go" style={{flex:1}} onClick={submit} disabled={loading}>
          {loading ? "…" : t.contest_submit}
        </button>
        <button className="lisn-action-btn" onClick={onReset}>
          <span>{t.contest_reset}</span>
        </button>
      </div>

      {loading && <div className="lisn-loading" style={{padding:"12px 0"}}><Orb/><span className="lisn-loading-text">{t.analyse_en_cours}</span></div>}

      {response && (
        <div className="lisn-msg l" style={{marginTop:0}}>
          <div className="lisn-msg-lbl">LISN</div>
          {response}
        </div>
      )}
    </div>
  );
}

// ─── DISCUSS PANEL ────────────────────────────────────────────────────────────
function DiscussPanel({ data, lang, t }) {
  const [hist, setHist] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [hist]);

  const ctx = { title:data?.entity?.title, artist:data?.entity?.artist, score:data?.score, regime:data?.regime, badges:data?.badges, verdict:data?.verdict?.text, lang };

  async function send() {
    const text = msg.trim();
    if (!text || loading) return;
    setMsg("");
    const next = [...hist, { role:"user", content:text }];
    setHist(next);
    setLoading(true);
    try {
      const res = await fetch("/api/discuss", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message:text, analysisContext:ctx, history:next, lang }) });
      const j = await res.json();
      setHist(h => [...h, { role:"assistant", content:j.reply || j.error || "Erreur." }]);
    } catch { setHist(h => [...h, { role:"assistant", content:"Connexion impossible." }]); }
    finally { setLoading(false); }
  }

  function onKey(e) { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }

  return (
    <div className="lisn-panel">
      <div className="lisn-panel-head">{t.discuter}</div>
      <div className="lisn-chat">
        {hist.length === 0 && <div className="lisn-msg l"><div className="lisn-msg-lbl">LISN</div>{t.discuss_intro}</div>}
        {hist.map((h,i) => (
          <div key={i} className={`lisn-msg ${h.role==="user"?"u":"l"}`}>
            <div className="lisn-msg-lbl">{h.role==="user"?(lang==="en"?"You":"Vous"):"LISN"}</div>
            {h.content}
          </div>
        ))}
        {loading && <div className="lisn-msg l"><div className="lisn-msg-lbl">LISN</div><span style={{opacity:.3}}>…</span></div>}
        <div ref={endRef} />
      </div>
      <div className="lisn-chat-form">
        <textarea className="lisn-chat-input" value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={onKey} placeholder={t.placeholder_discuss} rows={2} />
        <button className="lisn-chat-send" onClick={send} disabled={loading||!msg.trim()}>{t.envoyer}</button>
      </div>
    </div>
  );
}

// ─── COMPARE PANEL ────────────────────────────────────────────────────────────
function ComparePanel({ currentData, entityType, lang, t }) {
  const [qA, setQA] = useState("");
  const [qB, setQB] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const currentLabel = currentData?.entity?.title
    ? entityType==="artist" ? currentData.entity.artist : `${currentData.entity.artist} — ${currentData.entity.title}`
    : "";
  const cfg = DIMS[lang];

  async function go() {
    const a = qA.trim() || currentLabel;
    const b = qB.trim();
    if (!b) return;
    setLoading(true); setErr(""); setResult(null);
    try {
      const res = await fetch("/api/compare", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ queryA:a, queryB:b, entityType, analysisA:(!qA.trim()||qA.trim()===currentLabel)?currentData:null }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setResult(j);
    } catch(e) { setErr(e.message||"Erreur"); }
    finally { setLoading(false); }
  }

  return (
    <div className="lisn-panel">
      <div className="lisn-panel-head">{t.comparer}</div>
      <div className="lisn-compare-inputs">
        <input className="lisn-compare-input" value={qA} onChange={e=>setQA(e.target.value)} placeholder={currentLabel||t.comparer_a} />
        <input className="lisn-compare-input" value={qB} onChange={e=>setQB(e.target.value)} placeholder={t.comparer_b} />
      </div>
      <button className="lisn-compare-go" onClick={go} disabled={loading||!qB.trim()}>
        {loading ? t.compare_loading : t.compare_go}
      </button>
      {err && <p className="lisn-error" style={{marginTop:10}}>{err}</p>}
      {loading && <div className="lisn-loading" style={{padding:"16px 0"}}><Orb/><span className="lisn-loading-text">{t.analyse_en_cours}</span></div>}
      {result && (
        <div className="lisn-compare-result">
          {result.verdict?.verdict && <p className="lisn-compare-verdict-txt">« {result.verdict.verdict} »</p>}
          {result.verdict?.reason && <p className="lisn-compare-reason">{result.verdict.reason}</p>}
          <table className="lisn-compare-tbl">
            <thead>
              <tr>
                <th></th>
                <th>{result.a?.entity?.title || result.a?.entity?.artist || "A"}</th>
                <th>{result.b?.entity?.title || result.b?.entity?.artist || "B"}</th>
              </tr>
            </thead>
            <tbody>
              {DIM_KEYS.map(d => {
                const va = result.a?.score?.[d] ?? "—";
                const vb = result.b?.score?.[d] ?? "—";
                const w  = va > vb ? "a" : vb > va ? "b" : null;
                return (
                  <tr key={d}>
                    <td style={{fontFamily:"var(--font-mono)",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ink-3)"}}>{cfg[d].label}</td>
                    <td className={w==="a"?"w":""}>{va}</td>
                    <td className={w==="b"?"w":""}>{vb}</td>
                  </tr>
                );
              })}
              <tr>
                <td style={{fontFamily:"var(--font-mono)",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ink-3)"}}>Global</td>
                <td className={result.verdict?.winner==="a"?"w":""}>{result.a?.score?.global ?? ""}</td>
                <td className={result.verdict?.winner==="b"?"w":""}>{result.b?.score?.global ?? ""}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── SUGGESTIONS STRIP ───────────────────────────────────────────────────────
const HIGH_STRUCTURE = [
  { q:"Kind of Blue Miles Davis", label:"Miles Davis — Kind of Blue" },
  { q:"OK Computer Radiohead", label:"Radiohead — OK Computer" },
  { q:"Voodoo D'Angelo", label:"D'Angelo — Voodoo" },
  { q:"Dummy Portishead", label:"Portishead — Dummy" },
  { q:"Blue Joni Mitchell", label:"Joni Mitchell — Blue" },
  { q:"Mezzanine Massive Attack", label:"Massive Attack — Mezzanine" },
];
const LOW_STRUCTURE = [
  { q:"Despacito Luis Fonsi", label:"Luis Fonsi — Despacito" },
  { q:"Shape of You Ed Sheeran", label:"Ed Sheeran — Shape of You" },
  { q:"Blinding Lights The Weeknd", label:"The Weeknd — Blinding Lights" },
  { q:"Levitating Dua Lipa", label:"Dua Lipa — Levitating" },
];

function SuggestionsStrip({ lang, onAnalyse, currentScore }) {
  const t = T[lang];
  const isFr = lang === "fr";

  // Determine suggestion direction and label based on score range
  const getDirection = (score) => {
    if (score === null) return { works: HIGH_STRUCTURE, label: isFr ? "Structure élevée" : "High structure" };
    if (score >= 80) return {
      works: LOW_STRUCTURE,
      label: isFr ? "Structure plus légère — pour contraster" : "Lighter structure — for contrast"
    };
    if (score >= 60) return {
      works: HIGH_STRUCTURE,
      label: isFr ? "Structure plus dense — pour aller plus loin" : "Denser structure — go further"
    };
    if (score >= 40) return {
      works: HIGH_STRUCTURE,
      label: isFr ? "Structure significativement plus forte" : "Significantly stronger structure"
    };
    return {
      works: HIGH_STRUCTURE,
      label: isFr ? "Structure radicalement plus dense" : "Radically denser structure"
    };
  };

  const { works, label } = getDirection(currentScore);
  const picks = works.slice(0, 4);

  return (
    <div className="lisn-suggestions">
      <div className="lisn-suggestions-label">
        {t.suggestions_title}
        <span className="lisn-suggestions-sublabel">{label}</span>
      </div>
      <div className="lisn-suggestions-row">
        {picks.map((s, i) => (
          <button
            key={i}
            className="lisn-suggestion-chip"
            onClick={() => onAnalyse(s.q, "track")}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ANALYSIS RESULT ──────────────────────────────────────────────────────────
function AnalysisResult({ data, mode, lang, onAnalyseCitation }) {
  const [shortOpen, setShortOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [contestMode, setContestMode] = useState(false);
  const [userScores, setUserScores] = useState({});

  const t = T[lang];
  const entityType = data?.entity?.type || "track";
  const isDeep = mode==="deep" || data?.meta?.mode==="deep";
  const g = data?.score?.global ?? 0;
  const caps = data?.scoreCapsTriggered || [];

  // Initialize userScores from LISN scores when entering contest mode
  const enterContestMode = useCallback(() => {
    const init = {};
    DIM_KEYS.forEach(k => { init[k] = data?.score?.[k] ?? 50; });
    setUserScores(init);
    setContestMode(true);
    setActivePanel("contest");
  }, [data?.score]);

  function resetContestMode() {
    setContestMode(false);
    setUserScores({});
    setActivePanel(null);
  }

  function handleUserScoreChange(key, val) {
    setUserScores(prev => ({ ...prev, [key]: val }));
  }

  function togglePanel(name) {
    if (name === "contest") {
      if (contestMode) {
        resetContestMode();
      } else {
        enterContestMode();
      }
      return;
    }
    if (contestMode) { resetContestMode(); }
    setActivePanel(p => p === name ? null : name);
  }

  return (
    <div className="lisn-result">

      {/* HEADER */}
      <div className="lisn-result-header">
        <div>
          <div className="lisn-result-type-row">
            <span className="lisn-result-type">{(entityType).toUpperCase()}</span>
            <span className={`lisn-result-mode${isDeep?" deep":""}`}>{isDeep ? t.approfondi : t.rapide}</span>
          </div>
          <h1 className="lisn-result-title">
            {entityType === "artist" ? data.entity?.artist : data.entity?.title}
          </h1>
          {entityType !== "artist" && (
            <div className="lisn-result-artist">{data.entity?.artist}</div>
          )}
          <div className="lisn-result-meta">
            {data.entity?.album && entityType==="track" && <span>{data.entity.album}</span>}
            {data.entity?.year && <span>{data.entity.year}{data.entity?.yearEnd && data.entity.yearEnd !== data.entity.year ? ` – ${data.entity.yearEnd}` : ""}</span>}
            {data.entity?.label && <span>{data.entity.label}</span>}
          </div>
        </div>
        <CoverImage
          artist={data.entity?.artist}
          title={entityType==="artist" ? null : data.entity?.title}
          album={data.entity?.album}
          t={t}
          entityType={entityType}
        />
      </div>

      {/* EDITORIAL LAYOUT */}
      <div className="lisn-editorial">
        <div className="lisn-main">

          {/* VERDICT */}
          {data.verdict?.text && (() => {
            const vt = data.verdict.text;
            const isErr = vt.toLowerCase().includes("impossible") ||
              vt.toLowerCase().includes("identif") ||
              vt.toLowerCase().includes("non trouvé") ||
              vt.toLowerCase().includes("not found") ||
              vt.toLowerCase().includes("insufficient") ||
              vt.toLowerCase().includes("insuffisant") ||
              vt.toLowerCase().includes("requête");
            return isErr ? (
              <div className="lisn-analysis-notice">
                <span className="lisn-notice-icon">○</span>
                <span className="lisn-notice-text">{vt}</span>
              </div>
            ) : (
              <div className="lisn-verdict">
                <div className="lisn-verdict-tag">{t.verdict}</div>
                <p className="lisn-verdict-text">« {vt} »</p>
                <SourceNote sourceInfo={data.sourceInfo} t={t} />
              </div>
            );
          })()}

          {/* AD HOC NOTE */}
          {data.adHocNote && (
            <div className="lisn-adhoc-note">
              <span className="lisn-adhoc-icon">◦</span>
              <span className="lisn-adhoc-text">{data.adHocNote}</span>
            </div>
          )}

          {/* SCORE NOTIFICATION */}
          {data.scoreNotificationText && (
            <div className="lisn-score-notif">
              <span className="lisn-score-notif-text">{data.scoreNotificationText}</span>
            </div>
          )}

          {/* LECTURE COURTE */}
          {data.editorial?.short && (
            <>
              <button className="lisn-short-btn" onClick={() => setShortOpen(o => !o)}>
                <span className={`lisn-short-chevron ${shortOpen?"open":""}`}>›</span>
                {t.lecture_courte}
              </button>
              <div className={`lisn-short-body ${shortOpen?"open":""}`}>
                <p className="lisn-short-text">{data.editorial.short}</p>
              </div>
            </>
          )}

          {/* RÉGIME */}
          <RegimeBlock regime={data.regime} lang={lang} entityType={entityType} />

          {/* ALBUM/ARTIST-SPECIFIC BLOCKS */}
          <AlbumBlock albumAnalysis={data.albumAnalysis} lang={lang} />
          <ArtistBlock artistAnalysis={data.artistAnalysis} lang={lang} />

          {/* DIMENSIONS — interactive in contest mode */}
          <DimensionsBlock
            score={data.score}
            artistScores={data.artistScores}
            lang={lang}
            entityType={entityType}
            contestMode={contestMode}
            userScores={userScores}
            onUserScoreChange={handleUserScoreChange}
          />

          {/* Contest panel — sits directly below dims */}
          {contestMode && activePanel === "contest" && (
            <ContestPanel
              data={data} lang={lang} t={t}
              userScores={userScores}
              onReset={resetContestMode}
            />
          )}

          {/* LECTURE STRUCTURALE */}
          {data.editorial?.structural && (
            <div className="lisn-structural">
              <div className="lisn-label">{t.lecture}</div>
              <p className="lisn-structural-text">{data.editorial.structural}</p>
            </div>
          )}

          {/* LONGEVITY */}
          <LongevityBlock longevity={data.longevity} lang={lang} onAnalyseCitation={onAnalyseCitation} />

          {/* DEEP ZONE */}
          {isDeep && (data.deep?.worldview || data.deep?.psychologicalFunction || data.deep?.fullAnalysis) && (
            <div className="lisn-deep-zone">
              {data.deep?.worldview && (
                <div className="lisn-deep-block">
                  <div className="lisn-deep-label">{t.vision}</div>
                  <p className="lisn-deep-text">{data.deep.worldview}</p>
                </div>
              )}
              {data.deep?.psychologicalFunction && (
                <div className="lisn-deep-block">
                  <div className="lisn-deep-label">{t.fonction}</div>
                  <p className="lisn-deep-text">{data.deep.psychologicalFunction}</p>
                </div>
              )}
              {data.deep?.fullAnalysis && (
                <div className="lisn-deep-block">
                  <div className="lisn-deep-label">{t.analyse_app}</div>
                  <p className="lisn-deep-full">{data.deep.fullAnalysis}</p>
                </div>
              )}
            </div>
          )}

          {/* ACTIONS */}
          <div className="lisn-actions">
            <button className={`lisn-action-btn ${activePanel==="discuss"&&!contestMode?"active":""}`} onClick={() => togglePanel("discuss")}>
              <span>{t.discuter}</span>
            </button>
            <button className={`lisn-action-btn accent-btn ${contestMode?"active":""}`} onClick={() => togglePanel("contest")}>
              <span className="lbl">{t.contester}</span>
            </button>
            <button className={`lisn-action-btn ${activePanel==="compare"&&!contestMode?"active":""}`} onClick={() => togglePanel("compare")}>
              <span>{t.comparer}</span>
            </button>
          </div>

          {activePanel==="discuss"  && !contestMode && <DiscussPanel data={data} lang={lang} t={t} />}
          {activePanel==="compare" && !contestMode && <ComparePanel currentData={data} entityType={entityType} lang={lang} t={t} />}
        </div>

        {/* SIDE */}
        <div className="lisn-side">
          {g > 0 && (
          <div className="lisn-score-block">
            <div className={`lisn-score-num ${scoreClass(g)}`}>{g}</div>
            <div className="lisn-score-denom">{t.indice}</div>
            <div className="lisn-score-anchor">{scoreAnchor(g, t)}</div>
          </div>
        )}
          {data.badges?.length > 0 && (
            <div className="lisn-badges">
              {data.badges.map((b,i) => (
                <div key={i} className="lisn-badge">
                  <span className="lisn-badge-dot" />{b}
                </div>
              ))}
            </div>
          )}
          {caps.length > 0 && (
            <div className="lisn-caps">
              {caps.map((c,i) => (
                <div key={i} className="lisn-cap">{c.message}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GLOSSARY ────────────────────────────────────────────────────────────────────

const GLOSSARY = {
  fr: [
    {
      term: "Densité",
      short: "Nombre de vraies décisions musicales",
      body: "À quel point un morceau est rempli de choix compositionnels réels — harmonies, rythmes, textures qui interagissent. Un morceau dense n'est pas forcément complexe au sens classique. Kind of Blue (Miles Davis) est dense : chaque note est une décision. Un hit pop répétitif peut sonner chargé mais avoir une densité très faible.",
    },
    {
      term: "Tension",
      short: "Maintien de l'intensité",
      body: "La capacité d'une œuvre à maintenir une énergie interne, une attente, un conflit non résolu. Penderecki ou Radiohead maintiennent une tension constante. La tension élevée n'est pas inconfortable — elle est ce qui fait qu'on ne peut pas décrocher.",
    },
    {
      term: "Résolution",
      short: "Comment la tension se résout",
      body: "Comment l'œuvre gère ce qu'elle a créé. Peut être délibérément basse : certaines œuvres refusent la résolution comme choix artistique (Coltrane, fin des années 60). D'autres résolvent trop vite et perdent leur force.",
    },
    {
      term: "Singularité",
      short: "Ce que seule cette œuvre fait",
      body: "Le degré d'unicité formelle. Ce que seule cette œuvre accomplit dans l'espace des formes musicales. Un score élevé signifie qu'on ne peut pas la remplacer par autre chose. Björk a une singularité très haute. Un hit construit sur un template existant a une singularité basse.",
    },
    {
      term: "Profondeur",
      short: "Niveaux de lecture superposés",
      body: "Est-ce que l'œuvre survit à l'écoute répétée ? Est-ce qu'on entend encore de nouvelles choses après 10, 50, 100 écoutes ? What's Going On de Marvin Gaye a une profondeur très haute. Un morceau conçu pour une écoute passagère a une profondeur faible.",
    },
    {
      term: "Grain",
      short: "Texture sonore propre",
      body: "La matière sonore distinctive de l'œuvre — ce qui la rend reconnaissable à sa texture même, indépendamment de la mélodie ou des paroles. Tom Waits a un grain extrêmement fort. Portishead aussi. Un morceau produit avec des presets génériques a un grain faible.",
    },
    {
      term: "Résistance",
      short: "Tient si on enlève un élément",
      body: "La robustesse de la structure. Si on enlève la basse, le morceau s'effondre-t-il ? Si on enlève la voix, reste-t-il quelque chose ? Une résistance élevée signifie que la structure tient par elle-même. A Milli de Lil Wayne a une résistance élevée : la boucle seule porte déjà l'architecture.",
    },
    {
      term: "Régime structurel",
      short: "Comment l'œuvre existe dans l'histoire des formes",
      body: "L'ensemble des caractéristiques qui définissent comment une œuvre se positionne par rapport à l'espace des formes musicales possibles. Est-elle une exploration (elle invente) ou une sélection (elle choisit dans ce qui existe) ? Dépend-elle d'un template ou s'en affranchit-elle ?",
    },
    {
      term: "Exploration",
      short: "Va-t-elle vers du nouveau ?",
      body: "Le degré auquel une œuvre ou un artiste se déplace dans de nouveaux territoires formels. Une exploration élevée ne signifie pas simplement 'étrange' ou 'difficile' — ça signifie que l'œuvre occupe un espace qui n'existait pas avant elle. Sun Ra explore. Jason Derulo sélectionne.",
    },
    {
      term: "Template",
      short: "Modèle existant reproduit",
      body: "Un template est une formule musicale établie qu'une œuvre reproduit avec plus ou moins de fidélité. Couplet-refrain-pont est un template. La trap de 2016 est un template. Utiliser un template n'est pas un défaut en soi — tout dépend de ce qu'on fait à l'intérieur.",
    },
    {
      term: "OSR",
      short: "Ontologie Structurale du Réel",
      body: "Le système philosophique qui fonde LISN. L'OSR décrit le réel comme un espace de configurations sous contraintes. Appliquée à la musique : une œuvre est une configuration de décisions. Sa qualité se mesure à sa cohérence interne, sa résistance, sa profondeur — pas à sa popularité ou à son émotion brute.",
    },
    {
      term: "Minimalisme contraint",
      short: "Peu d'éléments, règles strictes",
      body: "Un régime où une œuvre utilise délibérément peu d'éléments mais les soumet à des règles très strictes. Different de la pauvreté structurelle : le minimalisme contraint réussi produit une intensité maximale avec un matériau minimal. Steve Reich, Philip Glass, et en rap : A Milli de Lil Wayne.",
    },
    {
      term: "Score structural",
      short: "Mesure de la solidité compositionnelle",
      body: "Le chiffre global calculé par LISN à partir des 7 dimensions structurelles. Ce n'est pas une note de popularité ni de qualité subjective. C'est une mesure de la solidité de la configuration : cohérence, résistance, profondeur. 85+ = œuvre qui a étendu l'espace des formes. 25-44 = formule bien exécutée.",
    },
  ],
  en: [
    {
      term: "Density",
      short: "Real musical decisions",
      body: "How packed a work is with genuine compositional choices — harmonies, rhythms, textures that interact. Dense doesn't mean classically complex. Kind of Blue (Miles Davis) is dense: every note is a decision. A repetitive pop hit can sound busy but have very low density.",
    },
    {
      term: "Tension",
      short: "Intensity maintenance",
      body: "A work's ability to maintain internal energy, expectation, unresolved conflict. Penderecki and Radiohead maintain constant tension. High tension isn't uncomfortable — it's what makes you unable to stop listening.",
    },
    {
      term: "Resolution",
      short: "How tension resolves",
      body: "How the work handles what it created. Can be deliberately low: some works refuse resolution as an artistic choice (Coltrane, late 1960s). Others resolve too quickly and lose their power.",
    },
    {
      term: "Singularity",
      short: "What only this work does",
      body: "The degree of formal uniqueness. What only this work achieves in the space of musical forms. A high score means it can't be replaced by something else. Björk has very high singularity. A hit built on an existing template has low singularity.",
    },
    {
      term: "Depth",
      short: "Layered meanings",
      body: "Does the work survive repeated listening? Do you still hear new things after 10, 50, 100 listens? What's Going On by Marvin Gaye has very high depth. A track designed for passive listening has low depth.",
    },
    {
      term: "Grain",
      short: "Distinctive sonic texture",
      body: "The work's distinctive sonic material — what makes it recognizable by its texture alone, independent of melody or lyrics. Tom Waits has extremely high grain. Portishead too. A track produced with generic presets has low grain.",
    },
    {
      term: "Resistance",
      short: "Holds if you remove one element",
      body: "The robustness of the structure. If you remove the bass, does the track collapse? If you remove the vocals, is there still something there? High resistance means the structure holds on its own. A Milli by Lil Wayne has high resistance: the loop alone carries the architecture.",
    },
    {
      term: "Structural regime",
      short: "How the work exists in the history of forms",
      body: "The set of characteristics that define how a work positions itself relative to the space of possible musical forms. Is it exploration (it invents) or selection (it chooses from what exists)? Does it depend on a template or break free from one?",
    },
    {
      term: "Exploration",
      short: "Does it go toward the new?",
      body: "The degree to which a work or artist moves into new formal territory. High exploration doesn't just mean 'strange' or 'difficult' — it means the work occupies a space that didn't exist before it. Sun Ra explores. Jason Derulo selects.",
    },
    {
      term: "Template",
      short: "Existing model reproduced",
      body: "A template is an established musical formula that a work reproduces with more or less fidelity. Verse-chorus-bridge is a template. 2016 trap is a template. Using a template isn't inherently a flaw — it depends on what you do inside it.",
    },
    {
      term: "OSR",
      short: "Structural Ontology of the Real",
      body: "The philosophical system underlying LISN. OSR describes reality as a space of configurations under constraints. Applied to music: a work is a configuration of decisions. Its quality is measured by internal coherence, resistance, depth — not popularity or raw emotion.",
    },
    {
      term: "Structural score",
      short: "Measure of compositional solidity",
      body: "The global number calculated by LISN from 7 structural dimensions. Not a popularity rating or subjective quality score. It measures the solidity of the configuration: coherence, resistance, depth. 85+ = work that extended the space of forms. 25-44 = formula well executed.",
    },
  ]
};

function GlossaryModal({ lang, onClose }) {
  const t = T[lang];
  const terms = GLOSSARY[lang] || GLOSSARY.fr;
  const [active, setActive] = useState(null);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="lisn-glossary-backdrop" onClick={onClose}>
      <div className="lisn-glossary-modal" onClick={e => e.stopPropagation()}>
        <div className="lisn-glossary-header">
          <span className="lisn-glossary-title">{t.glossaire}</span>
          <button className="lisn-glossary-close" onClick={onClose}>×</button>
        </div>
        <div className="lisn-glossary-body">
          {terms.map((item, i) => (
            <div key={i} className={`lisn-glossary-item ${active === i ? "open" : ""}`}>
              <button className="lisn-glossary-term-btn" onClick={() => setActive(active === i ? null : i)}>
                <span className="lisn-glossary-term">{item.term}</span>
                <span className="lisn-glossary-short">{item.short}</span>
                <span className="lisn-glossary-chevron">{active === i ? "−" : "+"}</span>
              </button>
              {active === i && (
                <div className="lisn-glossary-def">{item.body}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Inline term with tooltip on click
function Term({ children, term, lang }) {
  const [open, setOpen] = useState(false);
  const terms = GLOSSARY[lang] || GLOSSARY.fr;
  const entry = terms.find(t => t.term.toLowerCase() === (term || children?.toString() || "").toLowerCase());
  if (!entry) return <>{children}</>;
  return (
    <span className="lisn-inline-term" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
      {children}
      {open && (
        <span className="lisn-inline-def" onClick={e => e.stopPropagation()}>
          <span className="lisn-inline-def-text">{entry.body}</span>
          <button className="lisn-inline-def-close" onClick={() => setOpen(false)}>×</button>
        </span>
      )}
    </span>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Home() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("fast");
  const [entityType, setEntityType] = useState("track");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [osrOpen, setOsrOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [accentColor, setAccentColor] = useState('#C4601A');
  const [lang, setLangState] = useState('fr');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  function setLang(l) { setLangState(l); try { localStorage.setItem('lisn-lang', l); } catch {} }
  const resultRef = useRef(null);
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const entityTypeRef = useRef(entityType);
  useEffect(() => { entityTypeRef.current = entityType; }, [entityType]);
  const t = T[lang];

  // Load persisted settings AFTER hydration (client only)
  useEffect(() => {
    try {
      const savedDark   = localStorage.getItem('lisn-dark') === '1';
      const savedAccent = localStorage.getItem('lisn-accent') || '#C4601A';
      const savedLang   = localStorage.getItem('lisn-lang')   || 'fr';
      if (savedDark)              setDark(savedDark);
      if (savedAccent !== '#C4601A') setAccentColor(savedAccent);
      if (savedLang   !== 'fr')   setLangState(savedLang);
    } catch {}
    setSettingsLoaded(true);
  }, []);  // runs once after mount

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try { localStorage.setItem('lisn-dark', dark ? '1' : '0'); } catch {}
  }, [dark]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor);
    const hex = accentColor.replace('#','');
    const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
    document.documentElement.style.setProperty('--accent-soft', `rgba(\${r},\${g},\${b},0.08)`);
    document.documentElement.style.setProperty('--accent-glow', `rgba(\${r},\${g},\${b},0.18)`);
    try { localStorage.setItem('lisn-accent', accentColor); } catch {}
  }, [accentColor]);

  const osr = OSR_BLOCKS[lang];

  const placeholders = {
    track: t.placeholder_search_track,
    album: t.placeholder_search_album,
    artist: t.placeholder_search_artist,
  };

  function onAnalyseCitation(query, type) {
    setQuery(query);
    setEntityType(type);
    setData(null); // clear stale
    setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const endpoint = modeRef.current === "fast" ? "/api/analyse-fast" : "/api/analyse";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, lang, entityType: type })
        });
        const json = await res.json();
        if (!res.ok || json?.kind === "error") throw new Error(json?.error || "Erreur");
        setData(json);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
      } catch(e) { setError(e.message || "Erreur"); }
      finally { setLoading(false); }
    }, 50);
  }

  async function analyse() {
    const q = query.trim();
    if (!q) return;
    setData(null);   // clear stale data immediately
    setLoading(true); setError("");
    const currentMode = modeRef.current;
    const currentEntityType = entityTypeRef.current;
    try {
      const endpoint = currentMode==="fast" ? "/api/analyse-fast" : "/api/analyse";
      const res = await fetch(endpoint, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ query:q, lang, entityType:currentEntityType })
      });
      const json = await res.json();
      if (!res.ok || json?.kind==="error") throw new Error(json?.error || "Erreur analyse");
      // Auto-correct entityType if model returned different type
      const returnedType = json?.entity?.type;
      if (returnedType && returnedType !== currentEntityType) setEntityType(returnedType);
      setData(json);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
    } catch(e) { setError(e.message || "Erreur inconnue"); }
    finally { setLoading(false); }
  }

  function goHome() {
    setData(null);
    setQuery("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onKey(e) { if (e.key==="Enter") analyse(); }

  return (
    <main className="lisn-home">

      {/* MASTHEAD */}
      <div className="lisn-masthead">
        <div className="lisn-wordmark" style={{display:"flex",alignItems:"center",gap:0}}>
          <button className="lisn-home-btn" onClick={goHome} title={lang==="fr"?"Accueil":"Home"}>
            <LisnWordmark lang={lang} />
          </button>
          <span className="lisn-wordmark-tagline">
            {lang==="fr" ? "Mais tu peux toujours aimer ce que tu aimes." : "But you can still like what you like."}
          </span>
        </div>
        <div className="lisn-masthead-controls">
          {/* Glossaire — contenu éditorial, séparé des réglages */}
          <button className="lisn-ctrl-btn lisn-glossary-btn" onClick={() => setGlossaryOpen(true)}>
            {lang==="fr" ? "Glossaire" : "Glossary"}
          </button>

          {/* Séparateur */}
          <span className="lisn-masthead-sep" />

          {/* Réglages */}
          {data && (
            <button className="lisn-ctrl-btn lisn-back-btn" onClick={goHome}>
              {lang==="fr" ? "← Accueil" : "← Home"}
            </button>
          )}
          <button className={`lisn-ctrl-btn ${lang==="fr"?"active":""}`} onClick={() => setLang("fr")}>FR</button>
          <button className={`lisn-ctrl-btn ${lang==="en"?"active":""}`} onClick={() => setLang("en")}>EN</button>
          <button className="lisn-ctrl-btn" onClick={() => setDark(d => !d)}>{dark ? "☀" : "◑"}</button>
          <div className="lisn-accent-picker">
            <div className="lisn-accent-dot" onClick={() => setThemeOpen(o=>!o)} />
            {themeOpen && (
              <div className="lisn-accent-panel">
                {['#C4601A','#1A6B8A','#6B1A6B','#1A6B3A','#8A1A1A','#3D3D3D','#8A6B1A'].map(col => (
                  <div key={col} className={`lisn-accent-swatch ${accentColor===col?'active':''}`}
                    style={{background:col}} onClick={() => { setAccentColor(col); setThemeOpen(false); }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HERO — hidden during analysis */}
      <div className={`lisn-hero${data || loading ? " lisn-hero-hidden" : ""}`}>
        <div>
          <div className="lisn-hero-eyebrow">{lang==="fr" ? "Évaluation structurelle musicale" : "Structural music evaluation"}</div>
          <h1 className="lisn-hero-title">
            {lang==="fr"
              ? <><strong>Écouter</strong> autrement.<br/>Comprendre <strong>pourquoi.</strong></>
              : <><strong>Listen</strong> different.<br/>Hear <strong>why.</strong></>
            }
          </h1>
          <p className="lisn-hero-tagline">
            {lang==="fr"
              ? "Tout le monde juge déjà. LISN le dit à voix haute — avec un système derrière."
              : "Everyone already judges. LISN says it out loud — with a system behind it. But you can still like what you like."
            }
          </p>
        </div>
        <div className="lisn-osr-card">
          <div className="lisn-osr-tag">{t.osr_behind}</div>
          <p className="lisn-osr-card-text">
            {lang==="fr"
              ? "LISN ne crée pas la hiérarchie entre les œuvres — il la rend explicite, argumentée, et donc vraiment discutable. Il y a une architecture de pensée derrière chaque score."
              : "LISN doesn't create the hierarchy between works — it makes it explicit, argued, and therefore genuinely debatable. There is a framework of thought behind every score."
            }
          </p>
          <button className="lisn-osr-card-cta" onClick={() => setOsrOpen(o => !o)}>
            {osrOpen ? t.osr_close : t.osr_cta}
          </button>
        </div>
      </div>

      {/* OSR DRAWER */}
      <div className={`lisn-osr-drawer${data || loading ? " lisn-hidden" : ""}`}>
        <div className={`lisn-osr-body ${osrOpen?"open":""}`}>
          <div className="lisn-osr-inner">
            {osr.map(b => (
              <div key={b.title}>
                <div className="lisn-osr-block-title">{b.title}</div>
                <div className="lisn-osr-block-body">{b.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="lisn-search-wrap">
        {/* Entity type selector */}
        <div className="lisn-entity-tabs">
          {["track","album","artist"].map(et => (
            <button
              key={et}
              className={`lisn-entity-tab ${entityType===et?"active":""}`}
              onClick={() => setEntityType(et)}
            >
              {t[et]}
            </button>
          ))}
        </div>

        <div className="lisn-search-form">
          <input
            className="lisn-search-input"
            type="text"
            placeholder={placeholders[entityType]}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            autoComplete="off" autoCorrect="off" spellCheck={false}
          />
          <button className="lisn-search-btn" onClick={analyse} disabled={loading||!query.trim()}>
            <span>{loading ? "…" : t.analyser}</span>
          </button>
        </div>

        <div className="lisn-mode-row">
          <button className={`lisn-mode-btn lisn-mode-fast ${mode==="fast"?"active":""}`} onClick={() => setMode("fast")}>{t.rapide}</button>
          <button className={`lisn-mode-btn lisn-mode-deep ${mode==="deep"?"active":""}`} onClick={() => setMode("deep")}>{t.approfondi}</button>
        </div>

        {error && <ErrorSuggestion error={error} entityType={entityType} lang={lang} setEntityType={setEntityType} analyse={analyse} t={t} />}
      </div>

      {loading && (
        <div className="lisn-loading"><Orb/><span className="lisn-loading-text">{t.analyse_en_cours}</span></div>
      )}

      {data && !loading && (
        <div ref={resultRef}>
          <AnalysisResult data={data} mode={mode} lang={lang} onAnalyseCitation={onAnalyseCitation} />
          <SuggestionsStrip
            lang={lang}
            currentScore={data?.score?.global ?? null}
            onAnalyse={(q, type) => {
              setQuery(q);
              setEntityType(type);
              setData(null);
              setLoading(true); setError("");
              const endpoint = modeRef.current==="fast" ? "/api/analyse-fast" : "/api/analyse";
              fetch(endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({query:q, lang, entityType:type}) })
                .then(r => r.json())
                .then(json => { setData(json); setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100); })
                .catch(e => setError(e.message))
                .finally(() => setLoading(false));
            }}
          />
        </div>
      )}
      {glossaryOpen && <GlossaryModal lang={lang} onClose={() => setGlossaryOpen(false)} />}
    </main>
  );
}
