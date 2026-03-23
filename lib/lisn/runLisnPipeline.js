// /lib/lisn/runLisnPipeline.js — v3.4

import { parseModelJson }          from "./parseModelJson";
import { normalizeAnalysis }       from "./normalizeAnalysis";
import { deriveDisplayScores }     from "./scoringRules";
import { adaptAnalysisForDisplay } from "./displayAdapter";

export async function runLisnPipeline({ modelText, mode = "fast" }) {
  const startTime = Date.now();

  const parsed = parseModelJson(modelText);
  if (!parsed || parsed.kind === "error") {
    console.error("[runLisnPipeline] Parse error:", parsed?.error);
    return { kind:"error", error: parsed?.error || "Invalid JSON from model", rawPreview: modelText?.slice(0,500) ?? "" };
  }

  const normalized = normalizeAnalysis(parsed);
  if (normalized._error) {
    console.error("[runLisnPipeline] Normalize error:", normalized._error);
    return { kind:"error", error: normalized._error };
  }

  const { scores, scoreCapsTriggered } = deriveDisplayScores(normalized);
  const enriched = { ...normalized, scoreCapsTriggered: scoreCapsTriggered || [] };

  return adaptAnalysisForDisplay(enriched, scores, {
    mode,
    analysisTime: Date.now() - startTime,
    model: "anthropic",
  });
}
