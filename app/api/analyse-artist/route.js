import Anthropic from "@anthropic-ai/sdk";
import { runLisnPipeline, createAnthropicModelCall } from "../_shared";
import { buildArtistPrompt } from "@/lib/lisn/prompts/artistPrompt";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const modelCall = createAnthropicModelCall(anthropic);

export async function POST(req) {
  try {
    const body = await req.json();
    const { query } = body;

    const result = await runLisnPipeline({
      query,
      promptBuilder: buildArtistPrompt,
      modelCall
    });

    return Response.json(result);
  } catch (error) {
    console.error("analyse-artist error:", error);
    return Response.json({
      kind: "error",
      error: "Server error"
    });
  }
}