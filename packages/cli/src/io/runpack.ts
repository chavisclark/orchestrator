import fs from "node:fs";
import path from "node:path";
import { buildClaudePrompt, buildCodexPrompt, getDefaultRefs, safeTicketIdFromPath } from "./prompts.js";

export type RunPackResult = {
  ticketId: string;
  runDir: string;
  filesWritten: string[];
};

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath: string, content: string) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

export function createRunPack(args: {
  auditRunsRoot: string;
  ticketAbsPath: string;
}) : RunPackResult {
  const { auditRunsRoot, ticketAbsPath } = args;

  if (!fs.existsSync(ticketAbsPath)) {
    throw new Error(`Ticket not found: ${ticketAbsPath}`);
  }

  const ticketMd = fs.readFileSync(ticketAbsPath, "utf8");
  const ticketId = safeTicketIdFromPath(ticketAbsPath);

  const runDir = path.join(auditRunsRoot, ticketId);
  ensureDir(runDir);

  const refs = getDefaultRefs();

  const ticketMdPath = writeFile(path.join(runDir, "ticket.md"), ticketMd);
  const claudePromptPath = writeFile(
    path.join(runDir, "claude.prompt.txt"),
    buildClaudePrompt({ ticketId, ticketMd, refs })
  );
  const codexPromptPath = writeFile(
    path.join(runDir, "codex.prompt.txt"),
    buildCodexPrompt({ ticketId, ticketMd, refs })
  );

  const runMd = [
    `# Run Pack — ${ticketId}`,
    ``,
    `Run directory: ${runDir}`,
    `Ticket source: ${ticketAbsPath}`,
    ``,
    `## Artifacts`,
    `- ticket.md`,
    `- claude.prompt.txt`,
    `- codex.prompt.txt`,
    `- run.md`,
    ``,
    `## Placeholders (not generated in ORCH-T2)`,
    `- claude.output.md`,
    `- codex.verdict.txt`,
    ``,
  ].join("\n");

  const runMdPath = writeFile(path.join(runDir, "run.md"), runMd);

  return {
    ticketId,
    runDir,
    filesWritten: [ticketMdPath, claudePromptPath, codexPromptPath, runMdPath],
  };
}
