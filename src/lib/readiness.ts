import fs from "node:fs";
import path from "node:path";

import type { SiteConfig } from "@/config/site";
import {
  collectionDefinitions,
  primaryCollectionKeys,
} from "@/lib/content/collections";
import type {
  ContentRepository,
  ResourceRecord,
} from "@/lib/content/repository";
import { isPublicStatus } from "@/lib/content/repository";
import { collectAppPageRoutes, matchesAppPageRoute } from "@/lib/routes";

function pageFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return pageFiles(entryPath);
    return entry.isFile() && entry.name === "page.tsx" ? [entryPath] : [];
  });
}

function internalPath(href: string, siteUrl: string): string | undefined {
  const destination = new URL(href, siteUrl);
  if (destination.origin !== new URL(siteUrl).origin) return undefined;
  return destination.pathname.replace(/\/$/, "") || "/";
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

  const publishedByCollection = Object.fromEntries(
    primaryCollectionKeys.map((collection) => [
      collection,
      config.resourceCollections[collection]
        ? repository.resources[collection].filter((resource) =>
            isPublicStatus(resource.status, resource.publishedAt),
          )
        : [],
    ]),
  ) as Record<(typeof primaryCollectionKeys)[number], ResourceRecord[]>;
  const publishedResources = Object.values(publishedByCollection).flat();
  const publishedFaqs = config.resourceCollections.faqs
    ? repository.faqs.filter((faq) => isPublicStatus(faq.status, faq.publishedAt))
    : [];
  const appRoutes = collectAppPageRoutes(root);
  const publicResourceUrls = new Set(publishedResources.map((resource) => resource.url));

  const links = [
    ...config.navigation.map((item) => ({ label: `navigation item "${item.label}"`, href: item.href })),
    ...(config.primaryCta.href
      ? [{ label: "primary CTA", href: config.primaryCta.href }]
      : []),
    ...repository.products.flatMap((product) =>
      product.productPageUrl
        ? [{ label: `product "${product.name}"`, href: product.productPageUrl }]
        : [],
    ),
  ];

  for (const link of links) {
    const pathname = internalPath(link.href, config.company.url);
    if (!pathname) continue;

    if (!appRoutes.some((route) => matchesAppPageRoute(pathname, route))) {
      issues.push(`${link.label} points to missing route ${pathname}`);
      continue;
    }

    for (const collection of primaryCollectionKeys) {
      const route = collectionDefinitions[collection].route;
      if (pathname === route && publishedByCollection[collection].length === 0) {
        issues.push(`${link.label} points to empty or disabled collection ${route}`);
      } else if (
        pathname.startsWith(`${route}/`) &&
        !publicResourceUrls.has(pathname)
      ) {
        issues.push(`${link.label} points to unpublished resource ${pathname}`);
      }
    }

    if (pathname === "/resources" && publishedResources.length === 0) {
      issues.push(`${link.label} points to an empty resources page`);
    }
    if (pathname === "/faqs" && publishedFaqs.length === 0) {
      issues.push(`${link.label} points to an empty or disabled FAQ page`);
    }
  }

  for (const filePath of pageFiles(path.join(root, "src", "app"))) {
    if (fs.readFileSync(filePath, "utf8").includes("data-template-page")) {
      issues.push(`${path.relative(root, filePath)} still contains a template marker`);
    }
  }

  if (
    publishedResources.length > 0 &&
    config.media.hostname === "media.example.com"
  ) {
    issues.push("media.hostname still uses the template value");
  }

  const hasPublishedVideo = publishedResources.some(
    (resource) => "video" in resource && Boolean(resource.video),
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
