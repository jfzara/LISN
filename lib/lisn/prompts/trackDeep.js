import { LISN_DOCTRINE } from "./lisnDoctrine.js";
import { SHARED_RULES } from "./sharedRules.js";

export const TRACK_DEEP_PROMPT = `${LISN_DOCTRINE}\n${SHARED_RULES}\n
Tâche : analyse approfondie d’un morceau.

Objectif :
produire une analyse complète, plus justifiée, plus dense, plus doctrinalement explicite.

Méthode obligatoire :
1. identification correcte
2. tests structurels mentaux
3. diagnostic structurel complet
4. vision du monde
5. fonction psychologique
6. attribution des scores
7. sortie éditoriale développée

Exigences supplémentaires du mode deep :
- tests.* doit être rempli de manière utile
- worldview doit être renseigné
- psychologicalFunction doit être renseigné
- structuralDiagnosis doit être renseigné
- summary.short, summary.medium et summary.long doivent être présents
- editorial.shortVerdict, editorial.structuralReading et editorial.deepReading doivent être présents
- deep doit être substantiel
- les justifications doivent être plus précises que dans le mode rapide

entityType doit être "track".

IMPORTANT :
- retourne uniquement un objet JSON valide
- n’ajoute aucun texte avant ou après le JSON
- ne montre jamais ton raisonnement
`;