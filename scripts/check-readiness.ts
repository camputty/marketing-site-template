import { siteConfig } from "../src/config/site";
import { loadContentRepository } from "../src/lib/content/repository";
import { collectReadinessIssues } from "../src/lib/readiness";

const flags = new Set(process.argv.slice(2));
const enforce =
  flags.has("--production") ||
  !flags.has("--vercel") ||
  process.env.VERCEL_ENV === "production";

if (!enforce) {
  console.log(`Readiness gate skipped for Vercel ${process.env.VERCEL_ENV ?? "local"} build.`);
  process.exit(0);
}

try {
  const issues = collectReadinessIssues(siteConfig, loadContentRepository());
  if (issues.length > 0) {
    console.error(
      `Production readiness failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
    );
    process.exitCode = 1;
  } else {
    console.log("Production readiness passed.");
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
