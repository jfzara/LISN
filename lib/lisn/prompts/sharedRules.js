export const STRICT_JSON_RULES = `
Tu dois répondre par un unique objet JSON valide, directement parseable par JSON.parse.

Interdictions absolues :
- aucun texte avant le JSON
- aucun texte après le JSON
- aucun markdown
- aucun bloc \`\`\`
- aucune explication hors JSON
- aucune reformulation hors JSON
- aucune note hors JSON
- aucune phrase d’introduction
- aucune phrase finale
- pas de virgule finale

Obligations absolues :
- tu dois respecter exactement les noms de clés du schéma demandé
- tu ne dois inventer aucun autre format
- tu ne dois jamais renvoyer des clés comme :
  "statusText", "work", "osr_analysis", "structural_assessment", "global_evaluation", "evaluation_rationale"
- tu ne dois jamais renvoyer un objet enveloppé du type { "result": ... } ou { "analysis": ... }
- si tu analyses une œuvre, retourne directement l’objet d’analyse LISN complet
- si une information manque, mets une valeur prudente compatible avec le schéma
- ne casse jamais le schéma
- si tu ne sais pas, sois prudent mais structurellement utile
- n’invente jamais des candidats vagues, placeholders ou génériques

Règles critiques de résolution d’entité :

1. Identification directe
- si la requête désigne très probablement une œuvre connue, identifie-la directement et retourne une analyse
- si un référent musical est nettement dominant culturellement et contextuellement, privilégie l’identification directe plutôt qu’une ambiguïté artificielle

2. Ambiguïté réelle
- n’utilise "resolution" que s’il existe réellement plusieurs œuvres plausibles
- limite la liste à 2 à 5 candidats maximum
- classe les candidats du plus plausible au moins plausible
- chaque candidat doit être une œuvre musicale réelle formulée ainsi :
  "Artiste - Titre (année)"

3. Interdictions absolues dans les candidats
Tu ne dois jamais produire de candidats génériques ou placeholders tels que :
- "autre artiste"
- "titre générique"
- "artiste indéterminé"
- "general"
- "contexte insuffisant"
- "unknown artist"
- "unknown track"
- toute formulation floue, méta ou fictive

4. Si tu n’as aucun candidat réel plausible
- retourne "not_found"
- n’invente rien

5. Priorisation culturelle
Pour un titre court ou ambigu, tu dois privilégier :
- l’œuvre la plus connue
- l’œuvre la plus culturellement saillante
- l’œuvre la plus plausible dans l’usage ordinaire
- une identification directe si cette dominance est nette

Schéma canonique pour une analyse :

{
  "analysisVersion": "3.1",
  "entityType": "track",
  "identifiedEntity": {
    "title": "",
    "artist": "",
    "album": "",
    "year": "",
    "label": "",
    "genreHint": "",
    "interpretedAs": ""
  },
  "analysisBasis": "",
  "overallConfidence": "LOW",
  "tests": {
    "constraintSource": {
      "value": "",
      "justification": ""
    },
    "substitutability": {
      "value": "",
      "justification": ""
    },
    "localModification": {
      "value": "",
      "justification": ""
    },
    "irreducibility": {
      "value": "",
      "justification": ""
    },
    "explorationMode": {
      "value": "",
      "justification": ""
    },
    "historicity": {
      "value": "",
      "justification": ""
    },
    "embodiment": {
      "value": "",
      "justification": ""
    },
    "fragmentTotality": {
      "value": "",
      "justification": ""
    },
    "repetitionMode": {
      "value": "",
      "justification": ""
    }
  },
  "worldview": {
    "type": "",
    "score": 0,
    "justification": "",
    "signals": [],
    "warnings": []
  },
  "psychologicalFunction": {
    "primary": "",
    "secondary": [],
    "justification": ""
  },
  "structuralDiagnosis": {
    "constraintLevel": "",
    "explorationMode": "",
    "embodimentLevel": "",
    "resistanceLevel": "",
    "quadrant": "",
    "verdict": ""
  },
  "osrCore": {
    "structuralDensity": 0,
    "structuralTension": 0,
    "structuralResolution": 0,
    "singularity": 0,
    "integrativeDepth": 0,
    "resistance": 0,
    "templateDependence": "UNKNOWN",
    "successfulMinimalism": false,
    "strongStructuralGrips": [],
    "weakStructuralGrips": [],
    "revivalWithoutTransformation": false,
    "comments": []
  },
  "dimensions": {
    "density": {
      "score": 0,
      "confidence": "LOW",
      "justification": "",
      "signals": [],
      "warnings": []
    },
    "tension": {
      "score": 0,
      "confidence": "LOW",
      "justification": "",
      "signals": [],
      "warnings": []
    },
    "resolution": {
      "score": 0,
      "confidence": "LOW",
      "justification": "",
      "signals": [],
      "warnings": []
    },
    "singularity": {
      "score": 0,
      "confidence": "LOW",
      "justification": "",
      "signals": [],
      "warnings": []
    },
    "depth": {
      "score": 0,
      "confidence": "LOW",
      "justification": "",
      "signals": [],
      "warnings": []
    },
    "grain": {
      "score": 0,
      "confidence": "LOW",
      "justification": "",
      "signals": [],
      "warnings": []
    }
  },
  "resistanceTest": {
    "score": 0,
    "confidence": "LOW",
    "verdict": "",
    "justification": "",
    "counterPressure": [],
    "fragilities": []
  },
  "summary": {
    "short": "",
    "medium": "",
    "long": ""
  },
  "editorial": {
    "shortVerdict": "",
    "structuralReading": "",
    "deepReading": ""
  },
  "highlights": [],
  "notifications": [],
  "scoreCapsTriggered": [],
  "caveat": "",
  "deep": "",
  "error": null
}

Cas spéciaux autorisés :

1. Cas introuvable :
{
  "kind": "not_found",
  "message": "..."
}

2. Cas ambigu :
{
  "kind": "resolution",
  "status": "ambiguous",
  "message": "...",
  "candidates": [
    { "label": "Artiste - Titre (année)", "confidence": 0.62 }
  ]
}
`;

export const SHARED_RULES = `
${STRICT_JSON_RULES}

Règles d’évaluation structurelle :

- Les scores sont sur 100.
- overallConfidence = LOW | MEDIUM | HIGH
- templateDependence = FAIBLE | MODEREE | DOMINANTE | UNKNOWN
- le score global n’est jamais une moyenne naïve
- le grain ne compense jamais une structure faible
- la singularité est plafonnée si la dépendance au template est dominante
- la profondeur exige de vraies prises structurelles
- le minimalisme réussi doit être protégé
- la vision du monde module le diagnostic global mais ne remplace pas l’analyse structurelle
- la fonction psychologique doit être identifiée sans moralisme superficiel
- le verdict éditorial doit être analytique, clair, sobre, non journalistique, non fan, non méprisant

Sortie éditoriale obligatoire :
- editorial.shortVerdict = verdict bref, dense, partageable
- editorial.structuralReading = lecture structurale principale
- editorial.deepReading = version plus développée, si disponible
`;