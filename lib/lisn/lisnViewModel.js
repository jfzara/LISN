// lib/lisn/lisnViewModel.js
// /lib/lisn/lisnViewModel.js — v3.4

export function buildLisnViewModel(display) {
  return {
    entity: {
      type:    display.entityType || "track",
      title:   display.title   || "",
      artist:  display.artist  || "",
      album:   display.album   || "",
      year:    display.year    || "",
      yearEnd: display.yearEnd || "",
      label:   display.label   || "",
    },

    verdict: {
      text:       display.summary?.quickVerdict || "",
      confidence:  display.confidence  ?? null,
    globalScore: display.globalScore ?? null,
    genreScore:  display.genreScore  ?? null,
    },

    editorial: {
      short:      display.summary?.short      || "",
      structural: display.summary?.structural || "",
    },

    score: {
      global:      display.scores?.global      ?? 0,
      density:     display.scores?.density     ?? 0,
      tension:     display.scores?.tension     ?? 0,
      resolution:  display.scores?.resolution  ?? 0,
      singularity: display.scores?.singularity ?? 0,
      depth:       display.scores?.depth       ?? 0,
      grain:       display.scores?.grain       ?? 0,
      resistance:  display.scores?.resistance  ?? 0,
    },

    regime: display.regime || {},

    badges: Array.isArray(display.badges) ? display.badges : [],

    deep: {
      worldview:             display.deep?.worldview             || "",
      psychologicalFunction: display.deep?.psychologicalFunction || "",
      fullAnalysis:          display.deep?.analysis              || "",
    },

    longevity:      display.longevity      || null,
    artistScores:        display.artistScores        || null,
    relatedSuggestions:  display.relatedSuggestions  || [],
    adHocNote:           display.adHocNote           || null,
    scoreNotification:   display.scoreNotification   || null,
    scoreNotificationText: display.scoreNotificationText || null,
    sourceInfo:     display.sourceInfo     || null,
    albumAnalysis:  display.albumAnalysis  || null,
    artistAnalysis: display.artistAnalysis || null,

    scoreCapsTriggered: Array.isArray(display.scoreCapsTriggered)
      ? display.scoreCapsTriggered : [],

    meta: {
      mode:         display.mode         || "fast",
      analysisTime: display.analysisTime || null,
      model:        display.model        || null,
    },
  };
}
