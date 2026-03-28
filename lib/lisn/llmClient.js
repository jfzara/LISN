// lib/lisn/llmClient.js
// Multi-provider LLM client: Anthropic → Groq fallback

const GROQ_URL      = "https://api.groq.com/openai/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "gemma2-9b-it",
];

// ── Anthropic streaming ───────────────────────────────────────────
// onChunk(text) called for each text delta — optional, accumulates if not provided
async function callAnthropic({ model, system, userPrompt, maxTokens, onChunk }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("No ANTHROPIC_API_KEY");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": key,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0,
      stream: true,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(
      new Error(err?.error?.message || `Anthropic HTTP ${res.status}`),
      { status: res.status }
    );
  }

  let text = "";
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buf     = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop(); // keep incomplete line
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const d = JSON.parse(line.slice(6));
        if (d.type === "content_block_delta" && d.delta?.type === "text_delta") {
          const chunk = d.delta.text;
          text += chunk;
          if (onChunk) onChunk(chunk);
        }
      } catch {}
    }
  }
  return text;
}

// ── Groq (non-streaming) ──────────────────────────────────────────
async function callGroq({ system, userPrompt, maxTokens, compact }) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("No GROQ_API_KEY");

  const finalPrompt = compact
    ? userPrompt + "\n\nCRITICAL: Compact JSON only. No pretty-printing. Skip null/empty fields."
    : userPrompt;

  let lastError;
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        signal: AbortSignal.timeout(60000),
        headers: {
          "content-type": "application/json",
          "authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: Math.min(maxTokens, 8000),
          temperature: 0,
          messages: [
            { role: "system", content: system },
            { role: "user",   content: finalPrompt },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error?.message || `Groq HTTP ${res.status}`;
        lastError = Object.assign(new Error(msg), { status: res.status });
        if (msg.includes("decommissioned") || msg.includes("not found") || res.status === 404) {
          console.warn(`[Groq] ${model} unavailable, trying next...`);
          continue;
        }
        throw lastError;
      }

      const text = data.choices?.[0]?.message?.content || "";
      if (!text) throw new Error("Groq empty response");
      console.log(`[Groq] model=${model} finish=${data.choices?.[0]?.finish_reason} tokens=${data.usage?.completion_tokens}`);
      return text;

    } catch (e) {
      if (e.message?.includes("decommissioned") || e.message?.includes("not found")) {
        lastError = e; continue;
      }
      throw e;
    }
  }
  throw lastError || new Error("All Groq models failed");
}

// ── Strip markdown fences ─────────────────────────────────────────
function stripFences(text) {
  text = text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
  }
  return text;
}

// ── Public API ────────────────────────────────────────────────────
// onChunk(chunkText) — called for each text delta (streaming only, Anthropic)
export async function callLLM({
  system,
  userPrompt,
  maxTokens = 3200,
  preferGroq = false,
  compactForGroq = false,
  onChunk,
}) {
  const sonnet = process.env.ANTHROPIC_MODEL_FULL || "claude-sonnet-4-5-20250929";
  const haiku  = process.env.ANTHROPIC_MODEL_FAST || "claude-haiku-4-5-20251001";

  const providers = preferGroq
    ? ["groq", "anthropic-haiku", "anthropic-sonnet"]
    : ["anthropic-sonnet", "anthropic-haiku", "groq"];

  for (const provider of providers) {
    try {
      let text;
      if (provider === "groq") {
        text = await callGroq({ system, userPrompt, maxTokens, compact: compactForGroq });
      } else if (provider === "anthropic-haiku") {
        text = await callAnthropic({ model: haiku, system, userPrompt, maxTokens, onChunk });
      } else {
        text = await callAnthropic({ model: sonnet, system, userPrompt, maxTokens, onChunk });
      }
      if (text) {
        text = stripFences(text);
        console.log(`[llmClient] provider=${provider} chars=${text.length}`);
        return { text, provider };
      }
    } catch (e) {
      console.warn(`[llmClient] ${provider} failed: ${e.message}`);
      continue;
    }
  }
  throw new Error("All LLM providers failed");
}
