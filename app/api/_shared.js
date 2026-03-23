import { parseModelJson } from "@/lib/lisn/parseModelJson";
import { normalizeAnalysis } from "@/lib/lisn/normalizeAnalysis";
import { deriveDisplayScores } from "@/lib/lisn/scoringRules";
import { adaptAnalysisForDisplay } from "@/lib/lisn/displayAdapter";

export function extractAnthropicText(response) {
  try {
    if (!response || !Array.isArray(response.content)) return "";

    return response.content
      .filter((block) => block?.type === "text" && typeof block?.text === "string")
      .map((block) => block.text)
      .join("\n")
      .trim();
  } catch (e) {
    console.error("extractAnthropicText error:", e);
    return "";
  }
}

function looksLikeLisnAnalysis(obj) {
  return !!(
    obj &&
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    obj.analysisVersion &&
    obj.entityType &&
    obj.identifiedEntity &&
    obj.osrCore &&
    obj.dimensions &&
    obj.resistanceTest &&
    obj.summary
  );
}

export function createAnthropicModelCall(anthropic, modelName, options = {}) {
  const {
    maxTokens = 2600,
    temperature = 0
  } = options;

  return async function modelCall(prompt) {
    try {
      const response = await anthropic.messages.create({
        model: modelName,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: "user", content: prompt }]
      });

      const text = extractAnthropicText(response);

      if (!text) {
        throw new Error("Empty response from model");
      }

      return text;
    } catch (error) {
      console.error("Model call failed:", error);
      throw error;
    }
  };
}

export async function runLisnPipeline({ query, promptBuilder, modelCall }) {
  try {
    if (!query || !query.trim()) {
      return {
        kind: "error",
        error: "Empty query"
      };
    }

    const prompt = promptBuilder(query);
    const modelText = await modelCall(prompt);

    console.log("----- RAW MODEL OUTPUT START -----");
    console.log(modelText);
    console.log("----- RAW MODEL OUTPUT END -----");

    const parsed = parseModelJson(modelText);

    console.log("LISN parsed object:", JSON.stringify(parsed, null, 2));

    if (parsed?.kind === "resolution") {
      return parsed;
    }

    if (parsed?.kind === "not_found") {
      return parsed;
    }

    if (parsed?.kind === "error") {
      return {
        kind: "error",
        error: parsed.error || "Invalid model output",
        details: parsed.details || "",
        rawPreview: typeof modelText === "string" ? modelText.slice(0, 2000) : ""
      };
    }

    if (!looksLikeLisnAnalysis(parsed)) {
      return {
        kind: "error",
        error: "Model returned JSON, but not LISN schema",
        rawPreview: typeof modelText === "string" ? modelText.slice(0, 2000) : "",
        parsedPreview: parsed
      };
    }

    const normalized = normalizeAnalysis(parsed);

    console.log("LISN normalized object:", JSON.stringify(normalized, null, 2));

    const scoring = deriveDisplayScores(
      normalized.osrCore,
      normalized.dimensions
    );

    const scoredAnalysis = {
      ...normalized,
      displayScores: scoring.scores,
      scoreCapsTriggered: scoring.scoreCapsTriggered
    };

    const display = adaptAnalysisForDisplay(scoredAnalysis);

    return {
      kind: "analysis",
      analysis: scoredAnalysis,
      display
    };
  } catch (error) {
    console.error("LISN pipeline error:", error);

    return {
      kind: "error",
      error: "Pipeline failure",
      details: error?.message || "Unknown pipeline error"
    };
  }
}