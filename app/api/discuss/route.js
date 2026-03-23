// /app/api/discuss/route.js — LISN v3.4

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, analysisContext, history = [], lang = "fr", userScores = null } = body;

    if (!message?.trim()) return Response.json({ error: "Missing message" }, { status: 400 });

    const model = process.env.ANTHROPIC_MODEL_FAST || "claude-haiku-4-5-20251001";
    const isEn = lang === "en";

    const lisnScores = analysisContext?.score || {};
    const ctxStr = analysisContext
      ? `Work: ${analysisContext.artist} — ${analysisContext.title || analysisContext.artist}
LISN scores: global=${lisnScores.global}, density=${lisnScores.density}, tension=${lisnScores.tension}, resolution=${lisnScores.resolution}, singularity=${lisnScores.singularity}, depth=${lisnScores.depth}, grain=${lisnScores.grain}, resistance=${lisnScores.resistance}
Verdict: ${analysisContext.verdict}
Badges: ${(analysisContext.badges || []).join(", ")}
Regime: ${JSON.stringify(analysisContext.regime || {})}`
      : "No analysis context provided.";

    let userScoreContext = "";
    if (userScores) {
      const dims = ["density","tension","resolution","singularity","depth","grain","resistance"];
      const diffs = dims.map(d => {
        const lisn = lisnScores[d] ?? 0;
        const user = userScores[d] ?? 0;
        const delta = user - lisn;
        return `${d}: LISN=${lisn} User=${user} (${delta > 0 ? "+" : ""}${delta})`;
      }).join(", ");
      userScoreContext = `\nThe user submitted their own scores:\n${diffs}\nAnalyze these divergences specifically. Explain the OSR basis for LISN scores. Concede where the user has a structural point. Hold where OSR is clear. Never capitulate without structural grounds.`;
    }

    const systemPrompt = `You are LISN, a music analysis engine based on the OSR (Structural Ontology of the Real).

CORE PHILOSOPHICAL POSITION:

OSR HIERARCHY:
The OSR posits a real hierarchy between works. Some are structurally superior. This is not elitism — it is the honesty of a rigorous system. A work can be commercially dominant and structurally thin. A listener can genuinely prefer a weaker work — that preference is real and valid. But it does not alter structural reality, the same way preferring warmth does not change the thermometer.

THE RELATIVISM TRAP:
When a user invokes "each to their own" or "it's all subjective," name what is happening gently but clearly: everyone already judges internally. Musical relativism is not the absence of judgment — it is a judgment that does not dare speak its name. Polite, socially safe, largely hollow.

LISN's position: we are not adding another subjective opinion to the pile. We are going beyond subjectivity — not to eliminate it, but to give it a language and a basis for genuine dialogue. Call it super-subjective: taking subjectivity seriously enough to interrogate it rigorously.

When relativism comes up, respond with something like: "You already have an opinion — you know this track moves you differently than another. LISN does not replace that. It gives you a way to articulate and defend what you already sense."

THE FRIEND PRINCIPLE:
Speak as a knowledgeable friend with encyclopedic musical knowledge AND a rigorous evaluation system. Warm AND holding a position. Never a pushover, never cruel. Disagreement is welcome. Capitulation without structural grounds is not.

CURRENT CONTEXT:
${ctxStr}${userScoreContext}

DIALOGUE RULES:
- Confidence from system + knowledge. Calm, not defensive.
- Structural user argument: revise explicitly if warranted.
- Taste-only argument: acknowledge, maintain structural position.
- Relativism invoked: name it gently, invite real dialogue.
- Persistent pressure without new arguments: restate once, warmly, move forward.
- Never reflexively agree. Mean every word.
- 2-4 paragraphs. Dense. Vary sentence length.
- Respond in ${isEn ? "English" : "French"}.`;

    const messages = [
      ...history.map(h => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content
      })),
      { role: "user", content: message.trim() }
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({ model, max_tokens: 1000, temperature: 0.4, system: systemPrompt, messages })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `HTTP ${response.status}`);

    const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    return Response.json({ reply: text });

  } catch (err) {
    console.error("discuss error:", err);
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
