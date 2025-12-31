import fs from "node:fs";
import path from "node:path";
import { buildClaudePrompt, buildCodexPrompt, getDefaultRefs, safeTicketIdFromPath } from "./prompts.js";
import { findRepoRoot } from "../utils/repo-root.js";
import { collectGitEvidence } from "../utils/git-evidence.js";

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

/**
 * Extract file paths from "Files touched" section of ticket markdown
 */
function extractTouchedFiles(ticketMd: string): string[] {
  const lines = ticketMd.split("\n");
  const files: string[] = [];
  let inFilesSection = false;

  for (const line of lines) {
    if (line.match(/^##\s+Files touched/i)) {
      inFilesSection = true;
      continue;
    }
    if (inFilesSection && line.match(/^##\s+/)) {
      // Hit next section
      break;
    }
    if (inFilesSection) {
      // Look for lines like "- path/to/file.ext (create)" or "- path/to/file.ext"
      const match = line.match(/^-\s+([^\s(]+)/);
      if (match) {
        files.push(match[1]);
      }
    }
  }

  return files;
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

  const claudePrompt = buildClaudePrompt({ ticketId, ticketMd, refs });
  const codexPrompt = buildCodexPrompt({ ticketId, ticketMd, refs });

  const ticketMdPath = writeFile(path.join(runDir, "ticket.md"), ticketMd);

  const claudePromptPath = writeFile(
    path.join(runDir, "claude.prompt.txt"),
    claudePrompt
  );

  const codexPromptPath = writeFile(
    path.join(runDir, "codex.prompt.txt"),
    codexPrompt
  );

  const runMd = [
    `# Run Pack — ${ticketId}`,
    ``,
    `Run directory: ${runDir}`,
    `Ticket source: ${ticketAbsPath}`,
    ``,
    `---`,
    `## ticket.md`,
    ticketMd,
    ``,
    `---`,
    `## claude.prompt.txt`,
    claudePrompt,
    ``,
    `---`,
    `## codex.prompt.txt`,
    codexPrompt,
    ``,
    `---`,
    `## placeholders (not generated in ORCH-T2)`,
    `- claude.output.md`,
    `- codex.verdict.txt`,
    ``,
  ].join("\n");

  const runMdPath = writeFile(path.join(runDir, "run.md"), runMd);

  // Generate review.packet.md with git evidence
  const ticketDir = path.dirname(ticketAbsPath);
  let repoRoot: string;
  try {
    repoRoot = findRepoRoot(ticketDir);
  } catch (err: any) {
    throw new Error(`Failed to find repo root from ticket path: ${err.message}`);
  }

  const touchedFiles = extractTouchedFiles(ticketMd);
  const gitEvidence = collectGitEvidence({ repoRoot, touchedFiles });

  // Check if builder output exists
  const builderOutputPath = path.join(runDir, "claude.output.md");
  const builderOutput = fs.existsSync(builderOutputPath)
    ? fs.readFileSync(builderOutputPath, "utf8")
    : "[Builder output not yet available - run incomplete]";

  const reviewPacket = [
    `# Review Packet — ${ticketId}`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Ticket repo root: ${repoRoot}`,
    ``,
    `---`,
    `## Ticket`,
    ``,
    ticketMd,
    ``,
    `---`,
    `## Claude Prompt`,
    ``,
    claudePrompt,
    ``,
    `---`,
    `## Codex Prompt`,
    ``,
    codexPrompt,
    ``,
    `---`,
    `## Local Evidence`,
    ``,
    `### git status`,
    ``,
    "```",
    gitEvidence.status,
    "```",
    ``,
    `### git diff`,
    ``,
    "```",
    gitEvidence.diff || "(empty)",
    "```",
    ``,
  ];

  // If git diff is empty, add fallback evidence
  if (!gitEvidence.diff || gitEvidence.diff.trim() === "" || gitEvidence.diff.startsWith("[ERROR")) {
    reviewPacket.push(
      `### git log (recent commits)`,
      ``,
      "```",
      gitEvidence.logRecent || "(empty)",
      "```",
      ``,
    );

    if (gitEvidence.logFiles.length > 0) {
      reviewPacket.push(
        `### git log (touched files)`,
        ``,
      );
      for (const fileLog of gitEvidence.logFiles) {
        reviewPacket.push(
          "```",
          fileLog,
          "```",
          ``,
        );
      }
    }

    reviewPacket.push(
      `### git show HEAD`,
      ``,
      "```",
      gitEvidence.showHead || "(empty)",
      "```",
      ``,
    );
  }

  reviewPacket.push(
    `---`,
    `## Builder Output`,
    ``,
    builderOutput,
    ``,
  );

  const reviewPacketPath = writeFile(
    path.join(runDir, "review.packet.md"),
    reviewPacket.join("\n")
  );

  return {
    ticketId,
    runDir,
    filesWritten: [ticketMdPath, claudePromptPath, codexPromptPath, runMdPath, reviewPacketPath],
  };
}
