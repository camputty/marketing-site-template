import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const tsxCli = require.resolve("tsx/cli");
const readinessScript = path.join(
  process.cwd(),
  "scripts",
  "check-readiness.ts",
);

function runReadiness(vercelEnvironment: "preview" | "production") {
  return spawnSync(
    process.execPath,
    [tsxCli, readinessScript, "--vercel"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, VERCEL_ENV: vercelEnvironment },
    },
  );
}

describe("Vercel readiness command", () => {
  it("allows an unconfigured preview but enforces an unconfigured production", () => {
    const preview = runReadiness("preview");
    expect(preview.status).toBe(0);
    expect(preview.stdout).toContain(
      "Readiness gate skipped for Vercel preview build.",
    );

    const production = runReadiness("production");
    expect(production.status).toBe(1);
    expect(production.stderr).toContain("Production readiness failed:");
  });
});
