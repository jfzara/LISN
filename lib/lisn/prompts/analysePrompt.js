import { TRACK_FAST_PROMPT } from "./trackFast.js";
import { TRACK_DEEP_PROMPT } from "./trackDeep.js";

export function buildFastAnalysePrompt(query) {
  return `
${TRACK_FAST_PROMPT}

Requête utilisateur :
"${query}"
`.trim();
}

export function buildDeepAnalysePrompt(query) {
  return `
${TRACK_DEEP_PROMPT}

Requête utilisateur :
"${query}"
`.trim();
}