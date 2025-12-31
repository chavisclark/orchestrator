import OpenAI from "openai";

export type CodexReviewResult = {
  verdict: "APPROVED" | "BLOCKED" | "ESCALATE";
  rawResponse: string;
};

/**
 * Call OpenAI API (Codex reviewer) with review packet
 */
export async function callCodexReviewer(args: {
  prompt: string;
  apiKey: string;
  model?: string;
}): Promise<CodexReviewResult> {
  const { prompt, apiKey, model = "gpt-4o" } = args;

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    });

    const rawResponse = completion.choices[0]?.message?.content || "";

    // Parse verdict from response
    const verdict = parseVerdict(rawResponse);

    return {
      verdict,
      rawResponse,
    };
  } catch (err: any) {
    // Handle API errors gracefully
    if (err.status === 429) {
      throw new Error(
        `OpenAI API rate limit exceeded. Please wait and try again later. Details: ${err.message}`
      );
    }
    throw new Error(`OpenAI API error: ${err.message || String(err)}`);
  }
}

/**
 * Extract verdict from Codex response
 */
function parseVerdict(response: string): "APPROVED" | "BLOCKED" | "ESCALATE" {
  const upper = response.toUpperCase();

  if (upper.includes("VERDICT: APPROVED") || upper.includes("VERDICT:APPROVED")) {
    return "APPROVED";
  }
  if (upper.includes("VERDICT: BLOCKED") || upper.includes("VERDICT:BLOCKED")) {
    return "BLOCKED";
  }
  if (upper.includes("VERDICT: ESCALATE") || upper.includes("VERDICT:ESCALATE")) {
    return "ESCALATE";
  }

  // If no clear verdict found, treat as error (caller should handle)
  throw new Error(
    `Unable to parse verdict from Codex response. Expected VERDICT: APPROVED/BLOCKED/ESCALATE. Got: ${response.substring(0, 200)}`
  );
}
