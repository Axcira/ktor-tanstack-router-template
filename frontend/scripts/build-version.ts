import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type BuildVersion = {
  commit: string;
  commitShort: string;
  builtAt: string;
  dirty: boolean;
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "../..");

function readGitHead(): string {
  try {
    return execSync("git rev-parse HEAD", {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function isGitDirty(): boolean {
  try {
    const status = execSync("git status --porcelain", {
      cwd: repoRoot,
      encoding: "utf8",
    });
    return status.trim().length > 0;
  } catch {
    return false;
  }
}

function shortCommit(commit: string): string {
  if (commit === "unknown") return "unknown";
  return commit.length >= 7 ? commit.slice(0, 7) : commit;
}

export function resolveBuildVersion(): BuildVersion {
  const envCommit = process.env.GIT_COMMIT?.trim();
  const commit = envCommit && envCommit.length > 0 ? envCommit : readGitHead();
  return {
    commit,
    commitShort: shortCommit(commit),
    builtAt: new Date().toISOString(),
    dirty: isGitDirty(),
  };
}

export function repoRootPath(): string {
  return repoRoot;
}

export function gitAvailable(): boolean {
  return existsSync(join(repoRoot, ".git"));
}
