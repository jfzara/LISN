import { EMPTY_PROFILE } from "./profileSchema.js";

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function normalizeReaction(reaction) {
  switch (reaction) {
    case "loved":    return 1.0;
    case "liked":    return 0.8;
    case "intrigued":return 0.65;
    case "disagreed":return 0.2;
    case "neutral":
    default:         return 0.5;
  }
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function buildUserProfile(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return structuredClone(EMPTY_PROFILE);
  }

  const weighted = history
    .filter((item) => item?.analysis)
    .map((item) => {
      const a = item.analysis;
      const w = normalizeReaction(item.userReaction);
      return {
        w,
        D: (Number(a?.scores?.D) || 0) / 10,
        G: (Number(a?.scores?.G) || 0) / 10,
        S: (Number(a?.scores?.S) || 0) / 10,
        P: (Number(a?.scores?.P) || 0) / 10,
        resistance:
          a?.resistance?.status === "CONFIRMEE"   ? 0.8  :
          a?.resistance?.status === "PARTIELLE"   ? 0.55 :
          a?.resistance?.status === "NON_ETABLIE" ? 0.3  : 0.1,
        tasteRelation: a?.summary?.tasteRelation || "NEUTRE",
      };
    });

  if (!weighted.length) return structuredClone(EMPTY_PROFILE);

  const totalW = weighted.reduce((sum, x) => sum + x.w, 0) || 1;

  const affinity = {
    D: clamp01(weighted.reduce((s, x) => s + x.D * x.w, 0) / totalW),
    G: clamp01(weighted.reduce((s, x) => s + x.G * x.w, 0) / totalW),
    S: clamp01(weighted.reduce((s, x) => s + x.S * x.w, 0) / totalW),
    P: clamp01(weighted.reduce((s, x) => s + x.P * x.w, 0) / totalW),
  };

  const resistanceTolerance = clamp01(
    weighted.reduce((s, x) => s + x.resistance * x.w, 0) / totalW
  );

  const validationPreference = clamp01(
    avg(weighted.map((x) =>
      x.tasteRelation === "VALIDE"   ? 1   :
      x.tasteRelation === "MIXTE"    ? 0.6 :
      x.tasteRelation === "NEUTRE"   ? 0.5 : 0.2
    ))
  );

  const challengePreference = clamp01(
    avg(weighted.map((x) =>
      x.tasteRelation === "CHALLENGE" ? 1   :
      x.tasteRelation === "MIXTE"     ? 0.6 :
      x.tasteRelation === "NEUTRE"    ? 0.5 : 0.2
    ))
  );

  const noveltyPreference = clamp01((affinity.S * 0.6) + (resistanceTolerance * 0.4));

  const evidenceCount = weighted.length;
  const profileConfidence = clamp01(Math.min(1, evidenceCount / 12));

  const ranked = Object.entries(affinity)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

  const label = { D: "la Densité", G: "le Grain", S: "la Singularité", P: "la Profondeur" };

  const explanatorySummary =
    evidenceCount < 3
      ? `Profil encore préliminaire. Tu sembles réagir surtout à ${label[ranked[0]]}, avec un intérêt secondaire pour ${label[ranked[1]]}.`
      : `Tu sembles surtout attiré par ${label[ranked[0]]} et ${label[ranked[1]]}. ${
          resistanceTolerance >= 0.6
            ? "Tu tolères assez bien la friction structurelle."
            : "Tu sembles préférer les œuvres dont la friction reste mesurée."
        } ${
          noveltyPreference >= 0.6
            ? "La nouveauté structurelle te stimule assez souvent."
            : "Tu parais chercher moins la nouveauté brute que la tenue de l'œuvre."
        }`;

  return {
    dimensionAffinity: affinity,
    resistanceTolerance,
    noveltyPreference,
    validationPreference,
    challengePreference,
    profileConfidence,
    explanatorySummary,
    evidenceCount,
  };
}
