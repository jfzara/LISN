function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, num(x)));
}

function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function itemKey(item) {
  const a = item?.analysis || {};
  const title = normalizeText(a.title || item?.title);
  const artist = normalizeText(a.artist || item?.artist);
  return `${artist}::${title}`;
}

function analysisVector(analysis) {
  return {
    D: num(analysis?.scores?.D) / 10,
    G: num(analysis?.scores?.G) / 10,
    S: num(analysis?.scores?.S) / 10,
    P: num(analysis?.scores?.P) / 10,
    R:
      analysis?.resistance?.status === "CONFIRMEE"   ? 0.8  :
      analysis?.resistance?.status === "PARTIELLE"   ? 0.55 :
      analysis?.resistance?.status === "NON_ETABLIE" ? 0.3  : 0.1,
  };
}

function distance(a, b) {
  return (
    Math.abs(a.D - b.D) * 0.22 +
    Math.abs(a.G - b.G) * 0.28 +
    Math.abs(a.S - b.S) * 0.20 +
    Math.abs(a.P - b.P) * 0.22 +
    Math.abs(a.R - b.R) * 0.08
  );
}

function profileVector(profile) {
  return {
    D: clamp01(profile?.dimensionAffinity?.D),
    G: clamp01(profile?.dimensionAffinity?.G),
    S: clamp01(profile?.dimensionAffinity?.S),
    P: clamp01(profile?.dimensionAffinity?.P),
    R: clamp01(profile?.resistanceTolerance),
  };
}

function explainSameDNA(p, v) {
  const axes = [
    ["Grain",       Math.abs((p.G || 0) - v.G)],
    ["Profondeur",  Math.abs((p.P || 0) - v.P)],
    ["Densité",     Math.abs((p.D || 0) - v.D)],
    ["Singularité", Math.abs((p.S || 0) - v.S)],
  ]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([name]) => name);
  return `Proche de ton profil sur ${axes.join(" et ")}.`;
}

function explainAdjacent(p, v) {
  const deltas = [
    ["Grain",       v.G - (p.G || 0)],
    ["Profondeur",  v.P - (p.P || 0)],
    ["Densité",     v.D - (p.D || 0)],
    ["Singularité", v.S - (p.S || 0)],
  ].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  const [axis, delta] = deltas[0];
  const direction = delta > 0 ? "plus de" : "moins de";
  return `Compatible avec ton profil, mais avec ${direction} ${axis.toLowerCase()}.`;
}

function buildExcludedKeys(history = []) {
  return new Set(history.map(itemKey));
}

function dedupeByKey(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = itemKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function recommendSameDNA(profile, catalog = [], history = [], limit = 4) {
  const p = profileVector(profile);
  const excluded = buildExcludedKeys(history);

  return dedupeByKey(
    catalog
      .filter((item) => item?.analysis)
      .filter((item) => !excluded.has(itemKey(item)))
      .map((item) => {
        const v = analysisVector(item.analysis);
        return { ...item, _score: distance(p, v), reason: explainSameDNA(p, v) };
      })
      .sort((a, b) => a._score - b._score)
  ).slice(0, limit);
}

export function recommendAdjacent(profile, catalog = [], history = [], limit = 4) {
  const p = profileVector(profile);
  const excluded = buildExcludedKeys(history);

  return dedupeByKey(
    catalog
      .filter((item) => item?.analysis)
      .filter((item) => !excluded.has(itemKey(item)))
      .map((item) => {
        const v = analysisVector(item.analysis);
        const closeness =
          1 - (
            Math.abs(p.G - v.G) * 0.30 +
            Math.abs(p.P - v.P) * 0.25 +
            Math.abs(p.D - v.D) * 0.20 +
            Math.abs(p.S - v.S) * 0.15 +
            Math.abs(p.R - v.R) * 0.10
          );
        const noveltyBoost =
          Math.abs(p.S - v.S) * 0.45 +
          Math.abs(p.R - v.R) * 0.30 +
          Math.abs(p.D - v.D) * 0.15 +
          Math.abs(p.G - v.G) * 0.05 +
          Math.abs(p.P - v.P) * 0.05;
        return {
          ...item,
          _score: -(closeness * 0.6 + noveltyBoost * 0.4),
          reason: explainAdjacent(p, v),
        };
      })
      .sort((a, b) => a._score - b._score)
  ).slice(0, limit);
}
