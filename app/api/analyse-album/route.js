import Anthropic from "@anthropic-ai/sdk";
import { runLisnPipeline, createAnthropicModelCall } from "../_shared";
import { buildAlbumPrompt } from "@/lib/lisn/prompts/albumPrompt";

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
      promptBuilder: buildAlbumPrompt,
      modelCall
    });

    return Response.json(result);
  } catch (error) {
    console.error("analyse-album error:", error);
    return Response.json({
      kind: "error",
      error: "Server error"
    });
  }
}