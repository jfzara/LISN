// /app/api/compare/route.js
// Compare deux analyses LISN

import { runLisnPipeline } from "@/lib/lisn/runLisnPipeline";

export async function POST(req) {
  try {
    const body = await req.json();
    const { queryA, queryB, analysisA, analysisB } = body;

    if (!queryA?.trim() || !queryB?.trim()) {
      return Response.json({ error: "Missing queries" }, { status: 400 });
    }

    const model = process.env.ANTHROPIC_MODEL_FAST || "claude-haiku-4-5-20251001";

    // Si les analyses ne sont pas fournies, on les génère
    let aData = analysisA;
    let bData = analysisB;

    if (!aData) {
      const textA = await callModel(queryA, model);
      aData = await runLisnPipeline({ modelText: textA, mode: "fast" });
    }

    if (!bData) {
      const textB = await callModel(queryB, model);
      bData = await runLisnPipeline({ modelText: textB, mode: "fast" });
    }

    // Génère le verdict comparatif
    const verdict = await generateComparativeVerdict(aData, bData, model);

    return Response.json({
      a: aData,
      b: bData,
      verdict
    });

  } catch (err) {
    console.error("compare error:", err);
    return Response.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}

async function generateComparativeVerdict(a, b, model) {
  const titleA = a?.entity?.title || "Œuvre A";
  const titleB = b?.entity?.title || "Œuvre B";

  const systemPrompt = `
Tu es LISN. Tu produis un verdict comparatif structurel selon l'OSR.
Réponds UNIQUEMENT avec un JSON strict :
{
  "verdict": "phrase dense comparant les deux oeuvres",
  "winner": "a" ou "b" ou "draw",
  "reason": "explication courte (2-3 phrases)",
  "differentials": [
    { "dimension": "nom", "advantage": "a" ou "b", "note": "observation courte" }
  ]
}
`.trim();

  const userPrompt = `
Compare ces deux analyses LISN :

A — ${titleA} (score: ${a?.score?.global})
${JSON.stringify({ score: a?.score, regime: a?.regime, badges: a?.badges }, null, 2)}

B — ${titleB} (score: ${b?.score?.global})
${JSON.stringify({ score: b?.score, regime: b?.regime, badges: b?.badges }, null, 2)}
`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) return null;

  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("").trim();

  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { verdict: text, winner: null, reason: "", differentials: [] };
  }
}

async function callModel(query, model) {
  const systemPrompt = `
Tu es LISN. Réponds UNIQUEMENT avec un JSON strict selon ce schéma exact :
{
  "analysisVersion": "3.1",
  "entityType": "track",
  "identifiedEntity": { "title": "", "artist": "", "album": "", "year": "", "label": "", "genreHint": "", "interpretedAs": "" },
  "editorial": { "quickVerdict": "", "shortText": "", "structuralText": "" },
  "regime": { "structureType": "", "compositionMode": "", "templateDependence": "", "exploration": "", "constraintLevel": "", "dominantFunction": "" },
  "structuralScores": { "density": 0, "tension": 0, "resolution": 0, "singularity": 0, "depth": 0, "grain": 0, "resistance": 0 },
  "badges": [],
  "deep": { "worldview": "", "psychologicalFunction": "", "fullAnalysis": "" },
  "confidence": 0.0
}
`.trim();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: "user", content: `Analyse LISN : "${query}"` }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Anthropic HTTP ${response.status}`);

  return data.content?.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
}
