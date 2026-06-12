import fs from "node:fs";
import path from "node:path";

import type { SiteConfig } from "@/config/site";
import type { ContentRepository } from "@/lib/content/repository";
import { isPublicStatus } from "@/lib/content/repository";

function pageFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return pageFiles(entryPath);
    return entry.isFile() && entry.name === "page.tsx" ? [entryPath] : [];
  });
}

export function collectReadinessIssues(
  config: SiteConfig,
  repository: ContentRepository,
  root = process.cwd(),
): string[] {
  const issues: string[] = [];

  if (!config.company.name.trim()) issues.push("company.name is required");
  if (!config.company.description.trim()) issues.push("company.description is required");
  if (new URL(config.company.url).hostname === "example.com") {
    issues.push("company.url still uses example.com");
  }
  if (!config.primaryCta.label.trim() || !config.primaryCta.href.trim()) {
    issues.push("the primary CTA label and destination are required");
  }
  if (!config.seo.defaultTitle.trim() || !config.seo.defaultDescription.trim()) {
    issues.push("default SEO title and description are required");
  }

  for (const filePath of pageFiles(path.join(root, "src", "app"))) {
    if (fs.readFileSync(filePath, "utf8").includes("data-template-page")) {
      issues.push(`${path.relative(root, filePath)} still contains a template marker`);
    }
  }

  const publishedResources = Object.values(repository.resources)
    .flat()
    .filter((resource) => isPublicStatus(resource.status, resource.publishedAt));
  if (
    publishedResources.length > 0 &&
    config.media.hostname === "media.example.com"
  ) {
    issues.push("media.hostname still uses the template value");
  }

  const hasPublishedVideo = repository.resources.videos.some((resource) =>
    isPublicStatus(resource.status, resource.publishedAt),
  );
  if (
    hasPublishedVideo &&
    !process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE
  ) {
    issues.push(
      "NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE is required for published videos",
    );
  }

  return issues;
}
