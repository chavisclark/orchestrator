#!/usr/bin/env node
import { Command } from "commander";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRunPack } from "./io/runpack";

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

program.parse(process.argv);
