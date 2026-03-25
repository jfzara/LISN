// lib/lisn/scoringRules.js
// /lib/lisn/scoringRules.js
// Calcule les scores d'affichage à partir de l'analyse normalisée.
// Applique les règles OSR : plafonds, protections, corrections structurelles.

function clamp(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function deriveDisplayScores(normalized) {
  const s = normalized?.structuralScores || {};
  const regime = normalized?.regime || {};
  const caps = [];

  let density    = clamp(s.density    ?? 0);
  let tension    = clamp(s.tension    ?? 0);
  let resolution = clamp(s.resolution ?? 0);
  let singularity= clamp(s.singularity?? 0);
  let depth      = clamp(s.depth      ?? 0);
  let grain      = clamp(s.grain      ?? 0);
  let resistance = clamp(s.resistance ?? 0);

  // ── Règle 1 : Singularité plafonnée si templateDependence = DOMINANTE ──
  const templateDep = (regime.templateDependence || "").toUpperCase();
  if (
    templateDep.includes("DOMINANT") ||
    templateDep.includes("FORTE") ||
    templateDep.includes("ÉLEVÉE") ||
    templateDep.includes("ELEVEE")
  ) {
    if (singularity > 55) {
      singularity = 55;
      caps.push({
        rule: "TEMPLATE_CAP",
        message: "Singularité plafonnée : dépendance au template dominante.",
        field: "singularity",
        cappedAt: 55,
      });
    }
  }

  // ── Règle 2 : Profondeur plafonnée sans prises structurelles réelles ──
  // Proxy : si density < 35 ET resistance < 35, la profondeur ne peut dépasser 50
  if (density < 35 && resistance < 35) {
    if (depth > 50) {
      depth = 50;
      caps.push({
        rule: "DEPTH_NO_STRUCTURE",
        message: "Profondeur plafonnée : densité et résistance trop faibles pour ancrer la profondeur.",
        field: "depth",
        cappedAt: 50,
      });
    }
  }

  // ── Règle 3 : Protection du minimalisme réussi ──
  // Un morceau minimaliste (density basse) avec resistance ET singularity élevées
  // ne doit pas être pénalisé — on préserve son score global.
  const isSuccessfulMinimalism =
    density <= 45 && resistance >= 70 && singularity >= 65;

  // ── Règle 4 : Grain ne compense jamais une structure faible ──
  // Si density < 30 ET singularity < 30, le grain est plafonné à 60.
  if (density < 30 && singularity < 30) {
    if (grain > 60) {
      grain = 60;
      caps.push({
        rule: "GRAIN_NO_COMPENSATION",
        message: "Grain plafonné : ne peut compenser une structure insuffisante.",
        field: "grain",
        cappedAt: 60,
      });
    }
  }

  // ── Calcul du global (pondération OSR) ──
  let global =
    density    * 0.15 +
    tension    * 0.15 +
    resolution * 0.10 +
    singularity* 0.20 +
    depth      * 0.15 +
    grain      * 0.10 +
    resistance * 0.15;

  // ── Règle 5 : Global plafonné si densité + résistance faibles ──
  // (hors protection minimalisme)
  if (!isSuccessfulMinimalism && density < 35 && resistance < 35) {
    const rawGlobal = clamp(global);
    if (rawGlobal > 52) {
      global = 52;
      caps.push({
        rule: "GLOBAL_STRUCTURE_CAP",
        message: "Score global plafonné : densité et résistance structurelle insuffisantes.",
        field: "global",
        cappedAt: 52,
      });
    }
  }

  // Model's explicit globalScore overrides derived weighted average
  const modelGlobal = normalized?.globalScore;
  const finalGlobal = (modelGlobal && modelGlobal > 0) ? clamp(modelGlobal) : clamp(global);

  return {
    scores: {
      global: finalGlobal,
      density,
      tension,
      resolution,
      singularity,
      depth,
      grain,
      resistance,
    },
    scoreCapsTriggered: caps,
  };
}
