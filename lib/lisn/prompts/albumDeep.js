import { LISN_DOCTRINE } from "./lisnDoctrine.js";
import { SHARED_RULES } from "./sharedRules.js";

export const ALBUM_DEEP_PROMPT = `${LISN_DOCTRINE}\n${SHARED_RULES}\n
Tâche : analyse approfondie d’album.
entityType = "album".

Dans structuralDiagnosis, traiter explicitement :
- globalArchitecture
- intraAlbumContinuity
- sequenceNecessity
- rupture / continuité
- cohérence interne
- trajectoire de contraintes

Dans editorial.deepReading et deep, intégrer explicitement :
- nécessité de l’ordre des morceaux
- régimes de tension / résolution à l’échelle album
- unité vs collection
- persistance des motifs et logiques de transformation

Les scores doivent porter sur l’album comme configuration étendue, pas sur la simple moyenne implicite des titres.
Retourner uniquement un JSON valide.
`;