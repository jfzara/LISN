// /lib/lisn/normalizeAnalysis.js — v3.4
// Normalise les trois types d'entités : track, album, artist
// Chaque type a ses champs propres, tous garantis sans undefined.

export function normalizeAnalysis(raw) {
  if (!raw || typeof raw !== "object") {
    console.warn("[normalizeAnalysis] Input invalide");
    return buildDefault();
  }
  if (raw.kind === "error") {
    return { ...buildDefault(), _error: raw.error || "Model error" };
  }

  const entityType = safeStr(raw.entityType, "track");

  const base = {
    analysisVersion: raw.analysisVersion || "3.2",
    entityType,

    identifiedEntity: {
      title:         safeStr(raw.identifiedEntity?.title),
      artist:        safeStr(raw.identifiedEntity?.artist),
      album:         safeStr(raw.identifiedEntity?.album),
      year:          safeStr(raw.identifiedEntity?.year),
      yearEnd:       safeStr(raw.identifiedEntity?.yearEnd),   // pour artiste : période
      label:         safeStr(raw.identifiedEntity?.label),
      genreHint:     safeStr(raw.identifiedEntity?.genreHint),
      interpretedAs: safeStr(raw.identifiedEntity?.interpretedAs),
    },

    editorial: {
      quickVerdict:   safeStr(raw.editorial?.quickVerdict),
      shortText:      safeStr(raw.editorial?.shortText),
      structuralText: safeStr(raw.editorial?.structuralText),
    },

    badges: Array.isArray(raw.badges)
      ? raw.badges.filter(b => typeof b === "string").slice(0, 8)
      : [],

    deep: {
      worldview:             safeStr(raw.deep?.worldview),
      psychologicalFunction: safeStr(raw.deep?.psychologicalFunction),
      fullAnalysis:          safeStr(raw.deep?.fullAnalysis),
    },

    longevity: normalizeLongevity(raw.longevity),

    sourceInfo: raw.sourceInfo && typeof raw.sourceInfo === "object"
      ? { type: safeStr(raw.sourceInfo.type), reference: safeStr(raw.sourceInfo.reference) }
      : null,

    confidence: safeFloat(raw.confidence, null),
    adHocNote: safeStr(raw.adHocNote),
    scoreNotification: safeStr(raw.scoreNotification),
    scoreNotificationText: safeStr(raw.scoreNotificationText),
    _raw: raw,
  };

  // Champs spécifiques selon entityType
  if (entityType === "album") {
    return { ...base, ...normalizeAlbum(raw) };
  }
  if (entityType === "artist") {
    return { ...base, ...normalizeArtist(raw) };
  }
  // default: track
  return { ...base, ...normalizeTrack(raw) };
}

// ─── TRACK ──────────────────────────────────────────────────────────────────
function normalizeTrack(raw) {
  return {
    regime: {
      structureType:      safeStr(raw.regime?.structureType),
      compositionMode:    safeStr(raw.regime?.compositionMode),
      templateDependence: safeStr(raw.regime?.templateDependence),
      exploration:        safeStr(raw.regime?.exploration),
      constraintLevel:    safeStr(raw.regime?.constraintLevel),
      dominantFunction:   safeStr(raw.regime?.dominantFunction),
    },
    structuralScores: {
      density:     safeNum(raw.structuralScores?.density,     50),
      tension:     safeNum(raw.structuralScores?.tension,     50),
      resolution:  safeNum(raw.structuralScores?.resolution,  50),
      singularity: safeNum(raw.structuralScores?.singularity, 50),
      depth:       safeNum(raw.structuralScores?.depth,       50),
      grain:       safeNum(raw.structuralScores?.grain,       50),
      resistance:  safeNum(raw.structuralScores?.resistance,  50),
    },
    // Album/Artist-specific — null for track
    albumAnalysis: null,
    artistAnalysis: null,
  };
}

// ─── ALBUM ───────────────────────────────────────────────────────────────────
function normalizeAlbum(raw) {
  const a = raw.albumAnalysis || {};
  return {
    regime: {
      albumType:          safeStr(a.albumType || raw.regime?.albumType),
      compositionMode:    safeStr(a.compositionMode || raw.regime?.compositionMode),
      templateDependence: safeStr(a.templateDependence || raw.regime?.templateDependence),
      exploration:        safeStr(a.exploration || raw.regime?.exploration),
      constraintLevel:    safeStr(a.constraintLevel || raw.regime?.constraintLevel),
      dominantFunction:   safeStr(a.dominantFunction || raw.regime?.dominantFunction),
    },
    structuralScores: {
      // Pour album : density/tension/grain restent pertinents à l'échelle album
      density:     safeNum(raw.structuralScores?.density,     50),
      tension:     safeNum(raw.structuralScores?.tension,     50),
      resolution:  safeNum(raw.structuralScores?.resolution,  50),
      singularity: safeNum(raw.structuralScores?.singularity, 50),
      depth:       safeNum(raw.structuralScores?.depth,       50),
      grain:       safeNum(raw.structuralScores?.grain,       50),
      resistance:  safeNum(raw.structuralScores?.resistance,  50),
    },
    albumAnalysis: {
      overallQuality:              safeNum(a.overallQuality, 0),
      cohesion:                    safeNum(a.cohesion, 0),
      ambitionRealizationScore:    safeNum(a.ambitionRealizationScore, 0),
      ambitionRealizationText:     safeStr(a.ambitionRealizationText),
      trackQualityDistribution:    safeStr(a.trackQualityDistribution),
      peakTracks: Array.isArray(a.peakTracks) ? a.peakTracks.filter(t => typeof t === "string") : [],
      weakPoints:  Array.isArray(a.weakPoints)  ? a.weakPoints.filter(t => typeof t === "string")  : [],
      albumTypeText: safeStr(a.albumTypeText),
    },
    artistAnalysis: null,
  };
}

// ─── ARTIST ──────────────────────────────────────────────────────────────────
function normalizeArtist(raw) {
  const a = raw.artistAnalysis || {};
  const as_ = raw.artistScores || {};
  return {
    regime: {
      trajectory:         safeStr(a.trajectory || raw.regime?.trajectory),
      explorationLevel:   safeStr(a.explorationLevel || raw.regime?.exploration),
      consistency:        safeStr(a.consistencyLevel || raw.regime?.constraintLevel),
      dominantFunction:   safeStr(a.dominantFunction || raw.regime?.dominantFunction),
      periodCovered:      safeStr(a.periodCovered || raw.identifiedEntity?.periodCovered),
    },
    // Artist gets OSR-specific scores, not the track 7-dim scores
    structuralScores: {
      density:     safeNum(raw.structuralScores?.density,     0),
      tension:     safeNum(raw.structuralScores?.tension,     0),
      resolution:  safeNum(raw.structuralScores?.resolution,  0),
      singularity: safeNum(raw.structuralScores?.singularity, 0),
      depth:       safeNum(raw.structuralScores?.depth,       0),
      grain:       safeNum(raw.structuralScores?.grain,       0),
      resistance:  safeNum(raw.structuralScores?.resistance,  0),
    },
    // New: artist-specific OSR dimensions
    artistScores: {
      worldview:       safeNum(as_.worldview,       0),
      identity:        safeNum(as_.identity,        0),
      exploration:     safeNum(as_.exploration,     0),
      temporalDepth:   safeNum(as_.temporalDepth,   0),
      culturalFunction:safeNum(as_.culturalFunction,0),
    },
    artistAnalysis: {
      overallQuality:    safeNum(a.overallQuality, 0),
      consistency:       safeNum(a.consistency, 0),
      explorationScore:  safeNum(a.explorationScore, 0),
      culturalWeight:    safeNum(a.culturalWeight, 0),
      trajectoryText:    safeStr(a.trajectoryText),
      influenceText:     safeStr(a.influenceText),
      bestWork: Array.isArray(a.bestWork) ? a.bestWork.filter(x => typeof x === "string") : [],
      phases: Array.isArray(a.phases)
        ? a.phases.map(p => ({
            label:  safeStr(p.label),
            period: safeStr(p.period),
            desc:   safeStr(p.desc),
          }))
        : [],
    },
    albumAnalysis: null,
  };
}

// ─── LONGEVITY (commun aux trois types) ─────────────────────────────────────
function normalizeLongevity(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    score:              safeNum(raw.score, 0),
    influenceOnGenre:   safeStr(raw.influenceOnGenre),
    culturalReferences: safeStr(raw.culturalReferences),
    citations: Array.isArray(raw.citations)
      ? raw.citations.filter(c => typeof c === "string").slice(0, 10)
      : [],
    chartsLongevity: safeStr(raw.chartsLongevity),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function safeStr(value, fallback = "") {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function safeNum(value, fallback = 0) {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function safeFloat(value, fallback = null) {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function buildDefault() {
  return {
    analysisVersion: "3.2", entityType: "track",
    identifiedEntity: { title:"", artist:"", album:"", year:"", yearEnd:"", label:"", genreHint:"", interpretedAs:"" },
    editorial: { quickVerdict:"", shortText:"", structuralText:"" },
    regime: {}, structuralScores: { density:50, tension:50, resolution:50, singularity:50, depth:50, grain:50, resistance:50 },
    badges: [], deep: { worldview:"", psychologicalFunction:"", fullAnalysis:"" },
    longevity: null, sourceInfo: null, confidence: null,
    albumAnalysis: null, artistAnalysis: null,
    _error: null,
  };
}
