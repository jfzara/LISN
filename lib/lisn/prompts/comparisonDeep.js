import { LISN_DOCTRINE } from "./lisnDoctrine.js";
import { SHARED_RULES } from "./sharedRules.js";

export const COMPARISON_DEEP_PROMPT = `${LISN_DOCTRINE}\n${SHARED_RULES}\n
Tâche : comparaison structurale approfondie.
entityType = "comparison".

Comparer :
- track vs track
- album vs album
- artist vs artist

Le JSON doit inclure en plus :
"comparison": {
  "leftLabel": "",
  "rightLabel": "",
  "commonConstraintFamily": "",
  "sameStructuralProblem": "",
  "intensityGap": "",
  "originalityGap": "",
  "resistanceGap": "",
  "signatureVsInvention": "",
  "winner": "left|right|mixed|none"
}

Identifier si les deux entités traitent un même problème structurel par des solutions différentes.
Retourner uniquement un JSON valide.
`;