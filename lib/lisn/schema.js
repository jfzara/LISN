export const ANALYSIS_VERSION = "3.1";

export const ENTITY_TYPES = ["track", "album", "artist", "comparison"];
export const ANALYSIS_BASIS = ["DOCUMENTE", "INFERE", "EXPLORATOIRE"];
export const CONFIDENCE_LEVELS = ["LOW", "MEDIUM", "HIGH"];
export const TEMPLATE_DEPENDENCE = ["FAIBLE", "MODEREE", "DOMINANTE", "UNKNOWN"];

export const CANONICAL_EMPTY_ANALYSIS = {
  analysisVersion: ANALYSIS_VERSION,
  entityType: "track",

  identifiedEntity: {
    title: "",
    artist: "",
    album: "",
    year: "",
    label: "",
    genreHint: "",
    interpretedAs: "",
  },

  analysisBasis: "",
  overallConfidence: "LOW",

  tests: {
    constraintSource: {
      value: "",
      justification: "",
    },
    substitutability: {
      value: "",
      justification: "",
    },
    localModification: {
      value: "",
      justification: "",
    },
    irreducibility: {
      value: "",
      justification: "",
    },
    explorationMode: {
      value: "",
      justification: "",
    },
    historicity: {
      value: "",
      justification: "",
    },
    embodiment: {
      value: "",
      justification: "",
    },
    fragmentTotality: {
      value: "",
      justification: "",
    },
    repetitionMode: {
      value: "",
      justification: "",
    },
  },

  worldview: {
    type: "",
    score: 0,
    justification: "",
    signals: [],
    warnings: [],
  },

  psychologicalFunction: {
    primary: "",
    secondary: [],
    justification: "",
  },

  structuralDiagnosis: {
    constraintLevel: "",
    explorationMode: "",
    embodimentLevel: "",
    resistanceLevel: "",
    quadrant: "",
    verdict: "",
  },

  osrCore: {
    structuralDensity: 0,
    structuralTension: 0,
    structuralResolution: 0,
    singularity: 0,
    integrativeDepth: 0,
    resistance: 0,
    templateDependence: "UNKNOWN",
    successfulMinimalism: false,
    strongStructuralGrips: [],
    weakStructuralGrips: [],
    revivalWithoutTransformation: false,
    comments: [],
  },

  displayScores: {
    global: 0,
    density: 0,
    tension: 0,
    resolution: 0,
    singularity: 0,
    depth: 0,
    grain: 0,
    resistance: 0,
  },

  dimensions: {
    density: {
      score: 0,
      confidence: "LOW",
      justification: "",
      signals: [],
      warnings: [],
    },
    tension: {
      score: 0,
      confidence: "LOW",
      justification: "",
      signals: [],
      warnings: [],
    },
    resolution: {
      score: 0,
      confidence: "LOW",
      justification: "",
      signals: [],
      warnings: [],
    },
    singularity: {
      score: 0,
      confidence: "LOW",
      justification: "",
      signals: [],
      warnings: [],
    },
    depth: {
      score: 0,
      confidence: "LOW",
      justification: "",
      signals: [],
      warnings: [],
    },
    grain: {
      score: 0,
      confidence: "LOW",
      justification: "",
      signals: [],
      warnings: [],
    },
  },

  resistanceTest: {
    score: 0,
    confidence: "LOW",
    verdict: "",
    justification: "",
    counterPressure: [],
    fragilities: [],
  },

  summary: {
    short: "",
    medium: "",
    long: "",
  },

  editorial: {
    shortVerdict: "",
    structuralReading: "",
    deepReading: "",
  },

  highlights: [],
  notifications: [],
  scoreCapsTriggered: [],
  caveat: "",
  deep: "",
  comparison: {
    targetA: "",
    targetB: "",
    synthesis: "",
    decisiveDifferences: [],
    sharedStructures: [],
    verdict: "",
  },
  error: null,
};