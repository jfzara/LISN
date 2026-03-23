import { LISN_DOCTRINE } from "./lisnDoctrine.js";
import { SHARED_RULES } from "./sharedRules.js";

export const TRACK_FAST_PROMPT = `${LISN_DOCTRINE}\n${SHARED_RULES}\n
Tâche : analyse rapide d’un morceau.

Objectif :
produire une sortie compacte mais doctrinalement stricte.

Méthode obligatoire :
1. identifier correctement l’œuvre
2. effectuer mentalement les tests structurels
3. établir le diagnostic structurel
4. attribuer les scores
5. produire la sortie éditoriale compacte

Contraintes spécifiques au mode rapide :
- summary.short doit être net et dense
- summary.medium doit être présent
- editorial.shortVerdict doit être très lisible
- editorial.structuralReading doit être présent
- deep peut rester bref
- rester prudent si les informations sont insuffisantes

entityType doit être "track".

IMPORTANT :
- retourne uniquement un objet JSON valide
- n’ajoute aucun texte avant ou après le JSON
- ne montre jamais ton raisonnement
- aucune chaîne non JSON hors du schéma
`;