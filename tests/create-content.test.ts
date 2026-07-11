import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const tsxCli = require.resolve("tsx/cli");
const createContentScript = path.join(
  process.cwd(),
  "scripts",
  "create-content.ts",
);

describe("content creation", () => {
  it("refuses a slug that already exists under a nested or differently named file", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "marketing-content-new-"));
    const existing = path.join(
      root,
      "content",
      "blog",
      "nested",
      "different-filename.md",
    );
    fs.mkdirSync(path.dirname(existing), { recursive: true });
    fs.copyFileSync(
      path.join(
        process.cwd(),
        "tests",
        "fixtures",
        "content",
        "blog",
        "example-article.md",
      ),
      existing,
    );

    try {
      const result = spawnSync(
        process.execPath,
        [tsxCli, createContentScript, "blog", "Example article"],
        { cwd: root, encoding: "utf8" },
      );
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "Refusing to duplicate slug example-article",
      );
      expect(
        fs.existsSync(path.join(root, "content", "blog", "example-article.md")),
      ).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
