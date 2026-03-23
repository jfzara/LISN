import { LISN_DOCTRINE } from "./lisnDoctrine.js";
import { SHARED_RULES } from "./sharedRules.js";

export function buildAlbumPrompt(query) {
  return `
${LISN_DOCTRINE}
${SHARED_RULES}

Tâche : analyser un album comme unité structurale étendue.

Requête utilisateur :
"${query}"

Consignes :
- entityType doit être "album"
- évaluer la cohérence d’ensemble
- évaluer la variété interne sous contrainte
- distinguer accumulation de morceaux et vraie architecture d’album
- considérer transitions, tenue, nécessité interne, mémoire structurelle
- considérer la trajectoire de contraintes sur l’ensemble de l’album
- les champs tests, worldview, psychologicalFunction, structuralDiagnosis, summary et editorial doivent être remplis à l’échelle de l’album

Si l’album est ambigu, retourne le JSON de résolution ambiguë.
Si introuvable, retourne le JSON not_found.
Sinon retourne le JSON d’analyse complet.
`.trim();
}