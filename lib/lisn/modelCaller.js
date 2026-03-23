// /lib/lisn/modelCaller.js — v3.4
// Appel Anthropic centralisé pour toutes les routes LISN.

export async function callAnthropicModel({ prompt, userPrompt, model, maxTokens }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.3,
      system: prompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data?.error?.message || `Anthropic HTTP ${response.status}`;
    console.error("[callAnthropicModel] Error:", msg);
    throw new Error(msg);
  }

  return (
    data.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim() || ""
  );
}
