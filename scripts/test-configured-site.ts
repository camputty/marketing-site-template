import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const temporaryRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "marketing-site-configured-"),
);
const ignoredTopLevelEntries = new Set([
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "playwright-report",
  "test-results",
]);

function runPnpm(args: string[]) {
  const pnpmCli = process.env.npm_execpath;
  if (pnpmCli) {
    execFileSync(process.execPath, [pnpmCli, ...args], {
      cwd: temporaryRoot,
      env: {
        ...process.env,
        E2E_FIXTURE_MEDIA_HOST: "media.example.test",
        E2E_PRODUCTION_SERVER: "1",
        NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE: "fixturecode",
        VERCEL_ENV: "production",
      },
      stdio: "inherit",
    });
    return;
  }
  execFileSync("corepack", ["pnpm", ...args], {
    cwd: temporaryRoot,
    env: {
      ...process.env,
      E2E_FIXTURE_MEDIA_HOST: "media.example.test",
      E2E_PRODUCTION_SERVER: "1",
      NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE: "fixturecode",
      VERCEL_ENV: "production",
    },
    stdio: "inherit",
  });
}

try {
  fs.cpSync(root, temporaryRoot, {
    recursive: true,
    filter(source) {
      const relative = path.relative(root, source);
      const topLevelEntry = relative.split(path.sep)[0];
      if (topLevelEntry.startsWith(".env") && topLevelEntry !== ".env.example") {
        return false;
      }
      return !ignoredTopLevelEntries.has(topLevelEntry);
    },
  });

  const fixtureRoot = path.join(
    temporaryRoot,
    "tests",
    "fixtures",
    "configured-site",
  );
  fs.rmSync(path.join(temporaryRoot, "content"), {
    recursive: true,
    force: true,
  });
  fs.cpSync(
    path.join(temporaryRoot, "tests", "fixtures", "content"),
    path.join(temporaryRoot, "content"),
    { recursive: true },
  );
  fs.copyFileSync(
    path.join(fixtureRoot, "site.json"),
    path.join(temporaryRoot, "src", "config", "site.json"),
  );
  fs.copyFileSync(
    path.join(fixtureRoot, "page.tsx"),
    path.join(temporaryRoot, "src", "app", "page.tsx"),
  );
  fs.copyFileSync(
    path.join(fixtureRoot, "icon.svg"),
    path.join(temporaryRoot, "src", "app", "icon.svg"),
  );
  const productPage = path.join(
    temporaryRoot,
    "src",
    "app",
    "product",
    "page.tsx",
  );
  fs.mkdirSync(path.dirname(productPage), { recursive: true });
  fs.copyFileSync(path.join(fixtureRoot, "product-page.tsx"), productPage);

  const nextConfigPath = path.join(temporaryRoot, "next.config.ts");
  const nextConfigSource = fs.readFileSync(nextConfigPath, "utf8");
  const fixtureNextConfig = nextConfigSource.replace(
    "  images: {\n",
    "  images: {\n    unoptimized: true,\n",
  );
  if (fixtureNextConfig === nextConfigSource) {
    throw new Error("Could not enable deterministic fixture media rendering.");
  }
  fs.writeFileSync(nextConfigPath, fixtureNextConfig);

  runPnpm(["install", "--offline", "--frozen-lockfile"]);
  runPnpm(["build:vercel"]);
  runPnpm(["test:e2e"]);
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
