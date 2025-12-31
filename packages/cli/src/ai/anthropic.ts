import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";

export type ClaudeBuilderResult = {
  output: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
};

/**
 * Call Claude API with builder prompt and stream output to terminal
 */
export async function callClaudeBuilder(args: {
  prompt: string;
  apiKey: string;
  model?: string;
  onStream?: (chunk: string) => void;
}): Promise<ClaudeBuilderResult> {
  const { prompt, apiKey, model = "claude-sonnet-4-20250514", onStream } = args;

  const client = new Anthropic({ apiKey });

  let fullOutput = "";

  try {
    const stream = await client.messages.create({
      model,
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        const chunk = event.delta.text;
        fullOutput += chunk;
        if (onStream) {
          onStream(chunk);
        }
      }
    }

    return {
      output: fullOutput,
    };
  } catch (err: any) {
    // Handle API errors gracefully
    if (err.status === 429) {
      throw new Error(
        `Anthropic API rate limit exceeded. Please wait and try again later. Details: ${err.message}`
      );
    }
    throw new Error(`Anthropic API error: ${err.message || String(err)}`);
  }
}
