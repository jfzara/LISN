import { LISN_DOCTRINE } from "./lisnDoctrine.js";
import { SHARED_RULES } from "./sharedRules.js";

export function buildArtistPrompt(query) {
  return `
${LISN_DOCTRINE}
${SHARED_RULES}

Tâche : analyser un artiste ou groupe comme configuration structurale de trajectoire.

Requête utilisateur :
"${query}"

Consignes :
- entityType doit être "artist"
- juger la singularité réelle de la proposition artistique
- distinguer style reconnaissable et nécessité structurale
- considérer trajectoire, cohérence, renouvellement, dépendance aux templates, résistance
- intégrer les notions de phase, rigidification, transformation, stagnation, recomposition
- rester prudent si la discographie est vaste et hétérogène

Les champs tests, worldview, psychologicalFunction, structuralDiagnosis, summary et editorial doivent être remplis de manière compatible avec l’échelle artiste.

Si l’artiste est ambigu, retourne le JSON de résolution ambiguë.
Si introuvable, retourne le JSON not_found.
Sinon retourne le JSON d’analyse complet.
`.trim();
}