import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("toolchain pins", () => {
  it("keeps Node declarations aligned", () => {
    const nvm = fs.readFileSync(path.join(root, ".nvmrc"), "utf8").trim();
    const nodeVersion = fs
      .readFileSync(path.join(root, ".node-version"), "utf8")
      .trim();
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf8"),
    ) as {
      engines: { node: string };
      packageManager: string;
    };

    expect(nodeVersion).toBe(nvm);
    expect(packageJson.engines.node).toContain(`>=${nvm}`);
    expect(packageJson.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/);
  });
});
