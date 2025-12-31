import fs from "node:fs";
import path from "node:path";
import { createRunPack } from "../io/runpack.js";
import { callClaudeBuilder } from "../ai/anthropic.js";
import { callCodexReviewer } from "../ai/openai.js";

export type ExecResult = {
  verdict: "APPROVED" | "BLOCKED" | "ESCALATE";
  exitCode: 0 | 1 | 2 | 3;
  runDir: string;
};

type ExecConfig = {
  auditRunsRoot: string;
  ticketAbsPath: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  anthropicModel?: string;
  openaiModel?: string;
};

function log(runDir: string, message: string) {
  const timestamp = new Date().toISOString();
  const logPath = path.join(runDir, "exec.log");
  const logLine = `[${timestamp}] ${message}\n`;

  fs.appendFileSync(logPath, logLine, "utf8");
  console.log(message);
}

function logError(runDir: string, message: string, error?: any) {
  const timestamp = new Date().toISOString();
  const logPath = path.join(runDir, "exec.log");

  // Sanitize error (never print API keys)
  let errorMsg = "";
  if (error) {
    errorMsg = String(error.message || error);
    // Remove potential API key patterns
    errorMsg = errorMsg.replace(/sk-[a-zA-Z0-9-_]+/g, "[REDACTED]");
  }

  const logLine = `[${timestamp}] ERROR: ${message}${errorMsg ? ` - ${errorMsg}` : ""}\n`;

  fs.appendFileSync(logPath, logLine, "utf8");
  console.error(`ERROR: ${message}${errorMsg ? ` - ${errorMsg}` : ""}`);
}

/**
 * Execute full orchestration: Builder (Claude) → Reviewer (Codex)
 */
export async function executeTicket(config: ExecConfig): Promise<ExecResult> {
  const {
    auditRunsRoot,
    ticketAbsPath,
    anthropicApiKey,
    openaiApiKey,
    anthropicModel,
    openaiModel,
  } = config;

  let runDir: string;

  try {
    // Step 1: Generate or reuse run pack
    log("", "Step 1: Generating run pack...");
    const runPackResult = createRunPack({ auditRunsRoot, ticketAbsPath });
    runDir = runPackResult.runDir;

    log(runDir, `Run directory: ${runDir}`);
    log(runDir, "Run pack generated successfully");

    // Step 2: Read Claude prompt
    const claudePromptPath = path.join(runDir, "claude.prompt.txt");
    if (!fs.existsSync(claudePromptPath)) {
      throw new Error(`Claude prompt not found: ${claudePromptPath}`);
    }

    const claudePrompt = fs.readFileSync(claudePromptPath, "utf8");
    log(runDir, "Step 2: Calling Claude Builder API...");

    // Step 3: Call Claude with streaming
    const builderResult = await callClaudeBuilder({
      prompt: claudePrompt,
      apiKey: anthropicApiKey,
      model: anthropicModel,
      onStream: (chunk) => {
        // Stream to terminal
        process.stdout.write(chunk);
      },
    });

    process.stdout.write("\n"); // New line after streaming

    // Step 4: Write Claude output to file
    const claudeOutputPath = path.join(runDir, "claude.output.md");
    fs.writeFileSync(claudeOutputPath, builderResult.output, "utf8");
    log(runDir, `Builder output written to claude.output.md`);

    // Step 5: Regenerate review packet to include builder output
    log(runDir, "Step 3: Regenerating review packet with builder output...");
    createRunPack({ auditRunsRoot, ticketAbsPath });
    log(runDir, "Review packet updated");

    // Step 6: Read review packet
    const reviewPacketPath = path.join(runDir, "review.packet.md");
    if (!fs.existsSync(reviewPacketPath)) {
      throw new Error(`Review packet not found: ${reviewPacketPath}`);
    }

    const reviewPacket = fs.readFileSync(reviewPacketPath, "utf8");

    // Step 7: Read Codex prompt and combine with review packet
    const codexPromptPath = path.join(runDir, "codex.prompt.txt");
    if (!fs.existsSync(codexPromptPath)) {
      throw new Error(`Codex prompt not found: ${codexPromptPath}`);
    }

    const codexPrompt = fs.readFileSync(codexPromptPath, "utf8");
    const fullCodexPrompt = [
      codexPrompt,
      "",
      "---",
      "## Evidence and Builder Output",
      "",
      reviewPacket,
    ].join("\n");

    log(runDir, "Step 4: Calling Codex Reviewer API...");

    // Step 8: Call Codex
    const reviewResult = await callCodexReviewer({
      prompt: fullCodexPrompt,
      apiKey: openaiApiKey,
      model: openaiModel,
    });

    // Step 9: Write verdict
    const verdictPath = path.join(runDir, "codex.verdict.txt");
    const verdictContent = `VERDICT: ${reviewResult.verdict}\n\n---\nFull Response:\n\n${reviewResult.rawResponse}`;
    fs.writeFileSync(verdictPath, verdictContent, "utf8");

    log(runDir, `Verdict: ${reviewResult.verdict}`);
    log(runDir, `Verdict written to codex.verdict.txt`);

    // Step 10: Determine exit code
    const exitCode =
      reviewResult.verdict === "APPROVED"
        ? 0
        : reviewResult.verdict === "BLOCKED"
          ? 1
          : 2; // ESCALATE

    log(runDir, `Execution complete. Exit code: ${exitCode}`);

    return {
      verdict: reviewResult.verdict,
      exitCode: exitCode as 0 | 1 | 2 | 3,
      runDir,
    };
  } catch (error: any) {
    // If runDir is not yet set, we failed before creating run pack
    if (!runDir!) {
      console.error(`ERROR: ${error.message || String(error)}`);
      throw error;
    }

    logError(runDir, "Execution failed", error);

    return {
      verdict: "BLOCKED" as const,
      exitCode: 3,
      runDir,
    };
  }
}
