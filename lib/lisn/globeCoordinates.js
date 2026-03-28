// lib/lisn/globeCoordinates.js
// Transforme les scores OSR en coordonnées 3D sur le globe LISN.
//
// Architecture du globe :
//   - Distance au centre (rayon) = explorationScore → œuvres pionnières à la périphérie
//   - Altitude dans la coque     = structuralScore  → œuvres denses en surface
//   - Angle longitude + latitude = continent (dominantFunction)
//   - Dispersion dans continent  = singularity → œuvres singulières plus isolées
//   - Taille du point            = globalScore

// ── Continents — position angulaire centrale ─────────────────────
// [theta_deg, phi_deg]  theta=longitude (0-360), phi=latitude (-90 à +90)
const CONTINENT_CENTERS = {
  formal:       [0,    45],   // Nord-Ouest — Bach, Reich, Xenakis
  harmonic:     [40,   20],   // Nord       — Coltrane, jazz modal, blues
  textural:     [80,   10],   // Nord-Est   — Burial, Grouper, Eno ambient
  experimental: [130, -10],   // Est        — Merzbow, Arca, noise, concrète
  rhythmic:     [180, -20],   // Sud-Est    — funk, polyrhythmie, percussif
  groove:       [220, -30],   // Sud        — soul, R&B, hip-hop structurel
  narrative:    [270, -10],   // Sud-Ouest  — chanson, folk, singer-songwriter
  pop:          [310,  20],   // Ouest      — pop, variété, mainstream
  ambient:      [0,   -80],   // Pôle Sud   — drone pur, silence, océanique
};

// ── Distance entre continents (pour la fonction de proximité) ───
const CONTINENT_LIST = Object.keys(CONTINENT_CENTERS);

export function continentDistance(a, b) {
  if (a === b) return 0;
  const [ta, pa] = CONTINENT_CENTERS[a] || [0, 0];
  const [tb, pb] = CONTINENT_CENTERS[b] || [0, 0];
  // Distance angulaire approximative
  const dTheta = Math.abs(ta - tb) > 180 ? 360 - Math.abs(ta - tb) : Math.abs(ta - tb);
  const dPhi   = Math.abs(pa - pb);
  return Math.sqrt(dTheta * dTheta + dPhi * dPhi) / 360; // normalisé [0,1]
}

// ── Mapping dominantFunction → continent ────────────────────────
const FUNCTION_MAP = {
  // formal
  counterpoint: "formal", fugue: "formal", polyphonic: "formal",
  contrapuntal: "formal", "structural complexity": "formal",
  minimalist: "formal", formal: "formal", architectural: "formal",
  "voice leading": "formal", canon: "formal",
  // harmonic
  harmonic: "harmonic", tonal: "harmonic", jazz: "harmonic",
  modal: "harmonic", chromatic: "harmonic", "chord progression": "harmonic",
  blues: "harmonic", "harmonic exploration": "harmonic",
  // textural
  textural: "textural", timbral: "textural", atmospheric: "textural",
  "sonic texture": "textural", "timbral exploration": "textural",
  // experimental
  experimental: "experimental", "avant-garde": "experimental",
  noise: "experimental", abstract: "experimental", spectral: "experimental",
  microtonal: "experimental", aleatoric: "experimental",
  acousmatic: "experimental", "sound art": "experimental",
  // rhythmic
  rhythmic: "rhythmic", polyrhythmic: "rhythmic", metric: "rhythmic",
  percussive: "rhythmic", "groove-driven": "rhythmic",
  "rhythmic displacement": "rhythmic", "beat construction": "rhythmic",
  // groove
  groove: "groove", funk: "groove", soul: "groove",
  "r&b": "groove", "hip-hop": "groove", swing: "groove",
  "rhythmic pocket": "groove", "erotic ambivalence": "groove",
  // narrative
  narrative: "narrative", lyrical: "narrative", storytelling: "narrative",
  chanson: "narrative", folk: "narrative", "singer-songwriter": "narrative",
  poetic: "narrative", "textual density": "narrative",
  // pop
  pop: "pop", commercial: "pop", hook: "pop", catchy: "pop",
  radio: "pop", mainstream: "pop", melodic: "pop", "spectacle": "pop",
  // ambient / océan
  contemplative: "ambient", meditative: "ambient", sparse: "ambient",
  stillness: "ambient", space: "ambient", drone: "ambient",
  "sustained tone": "ambient",
};

export function detectContinent(dominantFunction) {
  if (!dominantFunction) return "pop"; // défaut
  const lower = dominantFunction.toLowerCase();
  // Chercher correspondance exacte
  if (FUNCTION_MAP[lower]) return FUNCTION_MAP[lower];
  // Chercher correspondance partielle
  for (const [key, continent] of Object.entries(FUNCTION_MAP)) {
    if (lower.includes(key)) return continent;
  }
  return "pop"; // défaut si non trouvé
}

// ── Fonction principale : scores → coordonnées globe ─────────────
//
// scores = {
//   structuralScore, explorationScore, globalScore,
//   density, tension, resolution, singularity,
//   depth, grain, resistance,
//   dominantFunction
// }
//
// Retourne { x, y, z, size, radius, continent, color }

export function computeGlobePosition(scores) {
  const {
    structuralScore  = 50,
    explorationScore = 50,
    globalScore      = 50,
    singularity      = 50,
    density          = 50,
    tension          = 50,
    grain            = 50,
    dominantFunction = "",
  } = scores;

  // ── Rayon de base : explorationScore [0.25, 1.0] ──────────────
  // Œuvres pionnières (exploration haute) → périphérie du globe
  // Œuvres conventionnelles (exploration basse) → cœur du globe
  const radius = 0.25 + (Math.max(0, Math.min(95, explorationScore)) / 95) * 0.75;

  // ── Coque : structuralScore [0, 0.12] ─────────────────────────
  // Œuvres denses structurellement → couche extérieure de leur rayon
  const shell = (Math.max(0, Math.min(95, structuralScore)) / 95) * 0.12;
  const r = radius + shell;

  // ── Continent → angles centraux ───────────────────────────────
  const continent = detectContinent(dominantFunction);
  const [thetaCenter, phiCenter] = CONTINENT_CENTERS[continent];

  // ── Dispersion : singularity → écart par rapport au centre ────
  // singularity haute → point plus isolé, plus éloigné du centre du continent
  // Utiliser un hash déterministe basé sur les scores pour la dispersion
  const dispersion = (Math.max(0, Math.min(100, singularity)) / 100) * 28;
  const noiseAngle = ((structuralScore * 7 + explorationScore * 13) % 360) - 180;
  const noiseLat   = ((density * 11 + tension * 3) % 180) - 90;

  const theta = thetaCenter + (noiseAngle / 180) * dispersion;
  const phi   = phiCenter   + (noiseLat   / 90)  * dispersion * 0.4;

  // ── Conversion sphériques → cartésiennes ──────────────────────
  const thetaRad = (theta * Math.PI) / 180;
  const phiRad   = (phi   * Math.PI) / 180;

  const x = r * Math.cos(phiRad) * Math.cos(thetaRad);
  const y = r * Math.sin(phiRad);
  const z = r * Math.cos(phiRad) * Math.sin(thetaRad);

  // ── Taille du point : globalScore [0.4, 3.0] ──────────────────
  const size = 0.4 + (Math.max(0, Math.min(95, globalScore)) / 95) * 2.6;

  // ── Couleur selon continent + grain ───────────────────────────
  const color = continentColor(continent, grain);

  return { x, y, z, size, radius: r, continent, color };
}

// ── Couleur par continent ────────────────────────────────────────
// Grain élevé → couleur plus saturée
function continentColor(continent, grain = 50) {
  const saturation = 0.4 + (grain / 100) * 0.6;
  const BASE_COLORS = {
    formal:       [0.85, 0.75, 0.55],  // or chaud — Bach, Reich
    harmonic:     [0.35, 0.65, 0.95],  // bleu jazz
    textural:     [0.55, 0.85, 0.75],  // turquoise — Burial, Eno
    experimental: [0.75, 0.35, 0.85],  // violet — Xenakis, Merzbow
    rhythmic:     [0.95, 0.65, 0.25],  // orange brûlé — funk, polyrhythmie
    groove:       [0.95, 0.45, 0.45],  // rouge-orange — soul, hip-hop
    narrative:    [0.65, 0.85, 0.45],  // vert — chanson, folk
    pop:          [0.95, 0.85, 0.35],  // jaune — pop mainstream
    ambient:      [0.45, 0.55, 0.85],  // bleu profond — drone, silence
  };
  const [r, g, b] = BASE_COLORS[continent] || [0.8, 0.8, 0.8];
  // Appliquer saturation
  const mid = (r + g + b) / 3;
  return [
    mid + (r - mid) * saturation,
    mid + (g - mid) * saturation,
    mid + (b - mid) * saturation,
  ];
}

// ── Fonction de proximité LISN ───────────────────────────────────
// Calcule la distance structurale entre deux œuvres
// Retourne [0, 1] — 0 = identique, 1 = opposés
export function computeLisnDistance(a, b) {
  const structDiff    = Math.abs((a.structuralScore  || 0) - (b.structuralScore  || 0)) / 95;
  const explorDiff    = Math.abs((a.explorationScore || 0) - (b.explorationScore || 0)) / 95;
  const globalDiff    = Math.abs((a.globalScore      || 0) - (b.globalScore      || 0)) / 95;
  const contDist      = continentDistance(
    detectContinent(a.dominantFunction || ""),
    detectContinent(b.dominantFunction || "")
  );

  // Dimensions structurelles
  const dims = ["density","tension","resolution","singularity","depth","grain","resistance"];
  let dimDiff = 0;
  for (const d of dims) {
    dimDiff += Math.abs((a[d] || 0) - (b[d] || 0)) / 100;
  }
  dimDiff /= dims.length;

  // Pondération selon le prompt LISN
  return (
    0.35 * structDiff  +
    0.35 * explorDiff  +
    0.20 * dimDiff     +
    0.10 * contDist
  );
}

export { CONTINENT_CENTERS, CONTINENT_LIST };
