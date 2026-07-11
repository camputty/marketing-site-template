import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  compareContentHistory,
  type ContentHistoryEntry,
} from "../src/lib/content/history";

function markdownFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
  });
}

function historyEntry(sourcePath: string, source: string): ContentHistoryEntry | undefined {
  const data = matter(source).data as Record<string, unknown>;
  const id = typeof data.id === "string" ? data.id : undefined;
  if (!id) return undefined;
  const segments = sourcePath.split("/");

  return {
    sourcePath,
    collection: segments[1] ?? "",
    id,
    slug: typeof data.slug === "string" ? data.slug : undefined,
    status: typeof data.status === "string" ? data.status : undefined,
    publishedAt:
      data.publishedAt instanceof Date
        ? data.publishedAt.toISOString().slice(0, 10)
        : typeof data.publishedAt === "string"
          ? data.publishedAt
          : undefined,
    redirectFrom: Array.isArray(data.redirectFrom)
      ? data.redirectFrom.filter((value): value is string => typeof value === "string")
      : [],
  };
}

function currentSnapshot(root: string): ContentHistoryEntry[] {
  return markdownFiles(path.join(root, "content")).flatMap((filePath) => {
    const sourcePath = path.relative(root, filePath).split(path.sep).join("/");
    const entry = historyEntry(sourcePath, fs.readFileSync(filePath, "utf8"));
    return entry ? [entry] : [];
  });
}

function git(root: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function previousSnapshot(root: string, base: string): ContentHistoryEntry[] {
  const paths = git(root, ["ls-tree", "-r", "--name-only", base, "--", "content"])
    .split("\n")
    .filter((filePath) => filePath.endsWith(".md"));

  return paths.flatMap((sourcePath) => {
    const source = git(root, ["show", `${base}:${sourcePath}`]);
    const entry = historyEntry(sourcePath, source);
    return entry ? [entry] : [];
  });
}

const root = process.cwd();
const baseFlag = process.argv.indexOf("--base");
const requestedBase =
  (baseFlag >= 0 ? process.argv[baseFlag + 1] : undefined) ??
  process.env.CONTENT_BASE_REF;

if (requestedBase && /^0+$/.test(requestedBase)) {
  console.log("Content history check skipped: no previous revision is available.");
  process.exit(0);
}

try {
  git(root, ["rev-parse", "--is-inside-work-tree"]);
} catch {
  console.log("Content history check skipped: this directory has no Git history.");
  process.exit(0);
}

const hasWorkingContentChanges = Boolean(
  git(root, ["status", "--porcelain", "--", "content"]).trim(),
);
const base = requestedBase ?? (hasWorkingContentChanges ? "HEAD" : "HEAD^");

try {
  git(root, ["cat-file", "-e", `${base}^{commit}`]);
} catch {
  if (!requestedBase) {
    console.log("Content history check skipped: no previous revision is available.");
    process.exit(0);
  }
  console.error(`Content history check failed: base revision ${base} is unavailable.`);
  process.exit(1);
}

const issues = compareContentHistory(
  previousSnapshot(root, base),
  currentSnapshot(root),
);

if (issues.length > 0) {
  console.error(
    `Content history check failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(`Content history valid against ${base}.`);
