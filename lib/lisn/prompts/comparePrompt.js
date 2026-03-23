import { LISN_DOCTRINE } from "./lisnDoctrine.js";
import { SHARED_RULES } from "./sharedRules.js";

export function buildComparePrompt(query) {
  return `
${LISN_DOCTRINE}
${SHARED_RULES}

Tâche : effectuer une comparaison structurale entre deux entités musicales.

Requête utilisateur :
"${query}"

Consignes :
- tu peux comparer deux morceaux, deux albums ou deux artistes
- retourne un JSON d’analyse standard
- ajoute aussi un champ "comparison" :
{
  "targetA": "",
  "targetB": "",
  "synthesis": "",
  "decisiveDifferences": [],
  "sharedStructures": [],
  "verdict": ""
}
- ne fais jamais une comparaison purement impressionniste
- distingue clairement différence de surface et différence structurelle
- identifie si les deux entités traitent un même problème structurel par des solutions différentes

Si la demande est ambiguë, retourne le JSON de résolution ambiguë.
Si introuvable, retourne le JSON not_found.
Sinon retourne le JSON d’analyse complet avec le champ "comparison".
`.trim();
}