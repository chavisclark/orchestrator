#!/usr/bin/env node
import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Resolve paths relative to THIS file (stable no matter where CLI is run from)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// orchestration repo root = orchestration/packages/cli/../../../
const orchRoot = path.resolve(__dirname, "..", "..", "..");
const auditRunsRoot = path.join(orchRoot, "audit", "runs");
function absPath(p) {
    return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}
const program = new Command();
program
    .name("orchestrator")
    .description("Orchestrator CLI")
    .version("0.0.1");
program
    .command("run")
    .argument("<ticketPath>", "Path to ticket markdown file (relative to current working dir)")
    .action((ticketPath) => {
    const ticketAbs = absPath(ticketPath);
    if (!fs.existsSync(ticketAbs)) {
        console.error(`Ticket not found: ${ticketAbs}`);
        process.exit(1);
    }
    const ticketId = path.basename(ticketAbs, path.extname(ticketAbs));
    const runDir = path.join(auditRunsRoot, ticketId);
    fs.mkdirSync(runDir, { recursive: true });
    // Minimal stub output for now
    fs.writeFileSync(path.join(runDir, "ticket.path.txt"), ticketAbs, "utf8");
    console.log(`Created run dir: ${runDir}`);
});
program.parse(process.argv);
