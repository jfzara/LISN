// /lib/lisn/parseModelJson.js — v3.5
// Parse le texte brut du modèle en JSON propre.
// Résistant aux balises markdown, trailing commas, troncatures, et espaces parasites.

export function parseModelJson(text) {
  if (!text || typeof text !== "string") {
    console.error("[parseModelJson] Texte vide ou invalide");
    return { kind: "error", error: "Empty model response" };
  }

  const clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .replace(/,\s*([\]}])/g, "$1")
    .trim();

  if (!clean) return { kind: "error", error: "Empty cleaned response" };

  // Attempt 1: direct parse
  try {
    const parsed = JSON.parse(clean);
    if (typeof parsed === "object" && !Array.isArray(parsed) && parsed !== null) {
      return parsed;
    }
  } catch (_) {}

  // Attempt 2: truncated JSON recovery
  // The model ran out of tokens mid-JSON — try to close open brackets
  try {
    const recovered = recoverTruncatedJson(clean);
    if (recovered) {
      const parsed = JSON.parse(recovered);
      if (typeof parsed === "object" && !Array.isArray(parsed) && parsed !== null) {
        console.warn("[parseModelJson] Recovered truncated JSON");
        return { ...parsed, _truncated: true };
      }
    }
  } catch (_) {}

  // Attempt 3: extract first complete JSON object via brace matching
  try {
    const extracted = extractFirstObject(clean);
    if (extracted) {
      const parsed = JSON.parse(extracted);
      if (typeof parsed === "object" && !Array.isArray(parsed) && parsed !== null) {
        console.warn("[parseModelJson] Extracted partial JSON object");
        return { ...parsed, _truncated: true };
      }
    }
  } catch (_) {}

  console.error("[parseModelJson] All parse attempts failed");
  console.error("[parseModelJson] Raw preview:", text?.slice(0, 400));
  return {
    kind: "error",
    error: `Invalid JSON: ${text?.slice(0, 120)}`,
    raw: text,
  };
}

function recoverTruncatedJson(text) {
  // Count open braces/brackets and close them
  let braces = 0, brackets = 0;
  let inString = false, escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") braces++;
    else if (ch === "}") braces--;
    else if (ch === "[") brackets++;
    else if (ch === "]") brackets--;
  }

  if (braces <= 0 && brackets <= 0) return null; // nothing to fix

  // Remove trailing incomplete string or comma
  let fixed = text.trimEnd();
  // Remove trailing comma before adding closers
  fixed = fixed.replace(/,\s*$/, "");
  // If we ended mid-string, close it
  if (inString) fixed += '"';
  // Close open brackets then braces
  fixed += "]".repeat(Math.max(0, brackets));
  fixed += "}".repeat(Math.max(0, braces));

  return fixed;
}

function extractFirstObject(text) {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0, inString = false, escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
