import { LISN_DOCTRINE } from "./lisnDoctrine.js";
import { SHARED_RULES } from "./sharedRules.js";

export const ARTIST_DEEP_PROMPT = `${LISN_DOCTRINE}\n${SHARED_RULES}\n
Tâche : analyse approfondie d’un artiste.
entityType = "artist".

Dans structuralDiagnosis, traiter explicitement :
- trajectoryCoherence
- structuralSignature
- constraintEvolution
- phaseBreaks
- stagnation / transformation / rigidification / désintégration / recomposition

Dans editorial.deepReading et deep, intégrer explicitement :
- continuités
- ruptures
- régime dominant
- rapport entre signature et invention
- comment la trajectoire se stabilise ou se transforme

Ne pas réduire l’artiste à sa notoriété ni à sa personnalité.
Retourner uniquement un JSON valide.
`;