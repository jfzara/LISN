// app/api/compare/route.js
export const maxDuration = 60;

import { makeCacheKey, getFromCache } from "../../../lib/lisn/analysisCache";
import { callLLM } from "../../../lib/lisn/llmClient";

// ── Analyse a single query using the main analyse route ──────────
async function analyseQuery(query, entityType, lang) {
  const cacheKey = makeCacheKey(query, entityType, lang);
  const cached = await getFromCache(cacheKey).catch(() => null);
  if (cached) return cached;

  // Call the analyse-fast route internally via fetch
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const res = await fetch(`${base}/api/analyse-fast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, lang, entityType }),
  });
  if (!res.ok) throw new Error(`Analysis failed for "${query}"`);

  // Cache hit: analyse-fast answers with plain JSON.
  // Cache miss: it streams NDJSON ({type:"chunk"} ... {type:"result"|"error"}).
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("ndjson")) return res.json();

  const lines = (await res.text()).split("\n").filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let msg;
    try { msg = JSON.parse(lines[i]); } catch { continue; }
    if (msg.type === "result") return msg.data;
    if (msg.type === "error") throw new Error(msg.error || `Analysis failed for "${query}"`);
  }
  throw new Error(`Analysis returned no result for "${query}"`);
}

// ── Generate comparative verdict ─────────────────────────────────
async function generateVerdict(a, b, lang) {
  const isFr = lang === "fr";

  const nameA = a?.entity?.artist
    ? (a.entity.title ? `${a.entity.artist} — ${a.entity.title}` : a.entity.artist)
    : "A";
  const nameB = b?.entity?.artist
    ? (b.entity.title ? `${b.entity.artist} — ${b.entity.title}` : b.entity.artist)
    : "B";

  const scoreA = a?.score?.global ?? 0;
  const scoreB = b?.score?.global ?? 0;

  const dims = ["density","tension","resolution","singularity","depth","grain","resistance"];
  const dimTable = dims.map(d => {
    const va = a?.score?.[d] ?? 0;
    const vb = b?.score?.[d] ?? 0;
    return `${d}: ${va} vs ${vb} (diff: ${va - vb > 0 ? "+" : ""}${va - vb})`;
  }).join("\n");

  const systemPrompt = isFr
    ? `Tu es LISN. Tu produis des verdicts comparatifs selon l'OSR. Sois direct, précis, sans charabia. Chaque phrase doit avoir un sens structural réel. Réponds UNIQUEMENT avec un JSON valide, sans markdown.`
    : `You are LISN. You produce comparative verdicts according to OSR. Be direct, precise. Every sentence must carry real structural meaning. Reply ONLY with valid JSON, no markdown.`;

  const userPrompt = isFr
    ? `Compare ces deux œuvres selon l'OSR :

A : ${nameA} — score global ${scoreA}
B : ${nameB} — score global ${scoreB}

Dimensions :
${dimTable}

Régime A : ${JSON.stringify(a?.regime || {})}
Régime B : ${JSON.stringify(b?.regime || {})}

Badges A : ${(a?.badges || []).join(", ")}
Badges B : ${(b?.badges || []).join(", ")}

Réponds avec :
{
  "verdict": "une phrase synthétique qui compare les deux œuvres — max 30 mots",
  "reason": "2-3 phrases courtes. Chaque phrase = une observation structurelle précise. Pas de jargon vide.",
  "winner": "a" | "b" | "draw"
}`
    : `Compare these two works according to OSR:

A: ${nameA} — global score ${scoreA}
B: ${nameB} — global score ${scoreB}

Dimensions:
${dimTable}

Respond with:
{
  "verdict": "one synthetic sentence comparing both works — max 30 words",
  "reason": "2-3 short sentences. Each = one precise structural observation. No empty jargon.",
  "winner": "a" | "b" | "draw"
}`;

  let text;
  try {
    ({ text } = await callLLM({ system: systemPrompt, userPrompt, maxTokens: 500 }));
  } catch {
    return null;
  }

  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { verdict: text, reason: "", winner: null };
  }
}

// ── POST handler ──────────────────────────────────────────────────
export async function POST(req) {
  try {
    const body = await req.json();
    const { queryA, queryB, entityType = "track", analysisA, lang = "fr" } = body;

    const qA = queryA?.trim();
    const qB = queryB?.trim();

    if (!qA || !qB) {
      return Response.json({ error: lang === "fr" ? "Requêtes manquantes" : "Missing queries" }, { status: 400 });
    }

    // A is already analysed — use it directly
    const aData = analysisA || await analyseQuery(qA, entityType, lang);

    // B needs to be analysed
    const bData = await analyseQuery(qB, entityType, lang);

    if (!aData || !bData) {
      return Response.json({ error: lang === "fr" ? "Analyse impossible" : "Analysis failed" }, { status: 500 });
    }

    const verdict = await generateVerdict(aData, bData, lang);

    return Response.json({ a: aData, b: bData, verdict });

  } catch (err) {
    console.error("compare error:", err);
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
