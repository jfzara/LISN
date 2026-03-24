// /lib/lisn/displayAdapter.js — v3.4

import { buildLisnViewModel } from "./lisnViewModel";

export function adaptAnalysisForDisplay(normalized, scores, meta = {}) {
  if (!normalized || typeof normalized !== "object") {
    console.error("[adaptAnalysisForDisplay] normalized invalide");
    normalized = {};
  }
  if (!scores || typeof scores !== "object") scores = {};

  const display = {
    entityType: normalized.entityType || "track",

    title:  normalized.identifiedEntity?.title  || "",
    artist: normalized.identifiedEntity?.artist || "",
    album:  normalized.identifiedEntity?.album  || "",
    year:   normalized.identifiedEntity?.year   || "",
    yearEnd:normalized.identifiedEntity?.yearEnd|| "",
    label:  normalized.identifiedEntity?.label  || "",

    summary: {
      quickVerdict: normalized.editorial?.quickVerdict   || "",
      short:        normalized.editorial?.shortText      || "",
      structural:   normalized.editorial?.structuralText || "",
    },

    regime: normalized.regime || {},

    deep: {
      worldview:             normalized.deep?.worldview             || "",
      psychologicalFunction: normalized.deep?.psychologicalFunction || "",
      analysis:              normalized.deep?.fullAnalysis          || "",
    },

    badges: Array.isArray(normalized.badges) ? normalized.badges : [],

    scores: {
      global:     scores.global      ?? 0,
      density:    scores.density     ?? 0,
      tension:    scores.tension     ?? 0,
      resolution: scores.resolution  ?? 0,
      singularity:scores.singularity ?? 0,
      depth:      scores.depth       ?? 0,
      grain:      scores.grain       ?? 0,
      resistance: scores.resistance  ?? 0,
    },

    longevity:      normalized.longevity      || null,
    artistScores:        normalized.artistScores        || null,
    relatedSuggestions:  normalized.relatedSuggestions  || [],
    adHocNote:           normalized.adHocNote           || null,
    scoreNotification:   normalized.scoreNotification   || null,
    scoreNotificationText: normalized.scoreNotificationText || null,
    sourceInfo:     normalized.sourceInfo     || null,
    albumAnalysis:  normalized.albumAnalysis  || null,
    artistAnalysis: normalized.artistAnalysis || null,

    scoreCapsTriggered: Array.isArray(normalized.scoreCapsTriggered)
      ? normalized.scoreCapsTriggered : [],

    confidence:  normalized.confidence  ?? null,
    globalScore: normalized.globalScore ?? null,
    genreScore:  normalized.genreScore  ?? null,
    mode:         meta.mode         || "fast",
    analysisTime: meta.analysisTime || null,
    model:        meta.model        || null,
  };

  return buildLisnViewModel(display);
}
