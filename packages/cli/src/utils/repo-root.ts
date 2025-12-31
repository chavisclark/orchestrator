import fs from "node:fs";
import path from "node:path";

/**
 * Find the git repository root by walking up from a starting directory
 * until we find a .git directory or reach the filesystem root.
 */
export function findRepoRoot(startPath: string): string {
  let current = path.resolve(startPath);

  while (true) {
    const gitPath = path.join(current, ".git");

    if (fs.existsSync(gitPath)) {
      return current;
    }

    const parent = path.dirname(current);

    // Reached filesystem root without finding .git
    if (parent === current) {
      throw new Error(`No git repository found from: ${startPath}`);
    }

    current = parent;
  }
}
