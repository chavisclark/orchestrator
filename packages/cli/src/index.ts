#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRunPack } from "./io/runpack.js";
import { executeTicket } from "./exec/executor.js";

function absPath(p: string) {
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

// Resolve paths relative to THIS file (stable no matter where CLI is run from)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// orchestrator repo root = packages/cli/../../../
const orchRoot = path.resolve(__dirname, "..", "..", "..");
const auditRunsRoot = path.join(orchRoot, "audit", "runs");

const program = new Command();

program
  .name("orchestrator")
  .description("Orchestrator CLI")
  .version("0.0.2");

program
  .command("run")
  .argument("<ticketPath>", "Path to ticket markdown file (relative to current working dir)")
  .action((ticketPath: string) => {
    const ticketAbsPath = absPath(ticketPath);

    try {
      const res = createRunPack({ auditRunsRoot, ticketAbsPath });
      console.log(`Created run artifacts: ${res.runDir}`);
    } catch (err: any) {
      console.error(err?.message || String(err));
      process.exit(1);
    }
  });

program
  .command("exec")
  .argument("<ticketPath>", "Path to ticket markdown file (relative to current working dir)")
  .description("Execute ticket: Builder (Claude) → Reviewer (Codex)")
  .action(async (ticketPath: string) => {
    const ticketAbsPath = absPath(ticketPath);

    // Validate environment variables
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!anthropicApiKey) {
      console.error("ERROR: ANTHROPIC_API_KEY environment variable is required");
      console.error("Set it with: export ANTHROPIC_API_KEY=sk-ant-...");
      process.exit(3);
    }

    if (!openaiApiKey) {
      console.error("ERROR: OPENAI_API_KEY environment variable is required");
      console.error("Set it with: export OPENAI_API_KEY=sk-...");
      process.exit(3);
    }

    try {
      const result = await executeTicket({
        auditRunsRoot,
        ticketAbsPath,
        anthropicApiKey,
        openaiApiKey,
        anthropicModel: process.env.ANTHROPIC_MODEL,
        openaiModel: process.env.OPENAI_MODEL,
      });

      console.log(`\n✓ Execution complete`);
      console.log(`  Verdict: ${result.verdict}`);
      console.log(`  Run directory: ${result.runDir}`);
      console.log(`  Exit code: ${result.exitCode}`);

      process.exit(result.exitCode);
    } catch (err: any) {
      console.error(`FATAL ERROR: ${err?.message || String(err)}`);
      process.exit(3);
    }
  });

program.parse(process.argv);
