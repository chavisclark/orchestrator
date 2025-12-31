import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * Execute a git command from a specific working directory
 */
function gitCommand(cwd: string, args: string[]): string {
  try {
    return execSync(`git ${args.join(" ")}`, {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (err: any) {
    // If git command fails, return error message
    return `[ERROR: ${err.message}]`;
  }
}

export type GitEvidence = {
  status: string;
  diff: string;
  logRecent: string;
  logFiles: string[];
  showHead: string;
};

/**
 * Collect git evidence from the repository containing the ticket
 */
export function collectGitEvidence(args: {
  repoRoot: string;
  touchedFiles?: string[];
}): GitEvidence {
  const { repoRoot, touchedFiles = [] } = args;

  const status = gitCommand(repoRoot, ["status"]);
  const diff = gitCommand(repoRoot, ["diff"]);

  // If diff is empty, collect fallback evidence
  const logRecent = diff.trim() === "" || diff.startsWith("[ERROR")
    ? gitCommand(repoRoot, ["log", "-n", "5", "--oneline"])
    : "";

  // Collect git log for each touched file (if diff is empty)
  const logFiles: string[] = [];
  if (diff.trim() === "" || diff.startsWith("[ERROR")) {
    for (const file of touchedFiles) {
      const filePath = path.join(repoRoot, file);
      if (fs.existsSync(filePath)) {
        const fileLog = gitCommand(repoRoot, [
          "log",
          "-n",
          "10",
          "--oneline",
          "--",
          file,
        ]);
        if (fileLog && !fileLog.startsWith("[ERROR")) {
          logFiles.push(`File: ${file}\n${fileLog}`);
        }
      }
    }
  }

  const showHead = diff.trim() === "" || diff.startsWith("[ERROR")
    ? gitCommand(repoRoot, ["show", "--name-only", "--oneline", "HEAD"])
    : "";

  return {
    status,
    diff,
    logRecent,
    logFiles,
    showHead,
  };
}
