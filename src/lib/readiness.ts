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
import { collectMarkdownLinks } from "@/lib/content/markdown";
import {
  collectAppPageRoutes,
  collectProtectedRedirectPaths,
  matchesAppPageRoute,
} from "@/lib/routes";
import { findTemplatePlaceholderPaths } from "@/lib/template-placeholders";
import { isCloudflareStreamCustomerCode } from "@/lib/video";

function pageFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return pageFiles(entryPath);
    return entry.isFile() && entry.name === "page.tsx" ? [entryPath] : [];
  });
}

function internalPath(
  href: string,
  siteUrl: string,
  baseUrl = siteUrl,
): string | undefined {
  const destination = new URL(href, baseUrl);
  if (destination.origin !== new URL(siteUrl).origin) return undefined;
  return destination.pathname.replace(/\/$/, "") || "/";
}

const metadataAssetExtensions = {
  icon: ["ico", "jpg", "jpeg", "png", "svg", "js", "ts", "tsx"],
  "opengraph-image": ["jpg", "jpeg", "png", "gif", "js", "ts", "tsx"],
} as const;

function hasMetadataAsset(
  root: string,
  prefix: keyof typeof metadataAssetExtensions,
): boolean {
  const appRoot = path.join(root, "src", "app");
  if (!fs.existsSync(appRoot)) return false;
  const extensions = metadataAssetExtensions[prefix].join("|");
  const convention = new RegExp(`^${prefix}\\d?\\.(?:${extensions})$`);
  return fs
    .readdirSync(appRoot, { withFileTypes: true })
    .some((entry) => entry.isFile() && convention.test(entry.name));
}

function hasSiteIcon(root: string): boolean {
  return (
    hasMetadataAsset(root, "icon") ||
    fs.existsSync(path.join(root, "src", "app", "favicon.ico")) ||
    fs.existsSync(path.join(root, "public", "favicon.ico"))
  );
}

function isTemplateHostname(hostname: string): boolean {
  return ["example.com", "example.org", "example.net"].some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

function templateHttpsHostname(value: string): string | undefined {
  if (!value.startsWith("https://")) return undefined;
  const hostname = new URL(value).hostname;
  return isTemplateHostname(hostname) ? hostname : undefined;
}

export function collectReadinessIssues(
  config: SiteConfig,
  repository: ContentRepository,
  root = process.cwd(),
  now = new Date(),
): string[] {
  const issues: string[] = [];
  const today = now.toISOString().slice(0, 10);

  if (!config.company.name.trim()) issues.push("company.name is required");
  if (!config.company.description.trim()) issues.push("company.description is required");
  const companyHostname = new URL(config.company.url).hostname;
  if (isTemplateHostname(companyHostname)) {
    issues.push(`company.url still uses ${companyHostname}`);
  }
  if (!config.primaryCta.label.trim() || !config.primaryCta.href.trim()) {
    issues.push("the primary CTA label and destination are required");
  }
  const primaryCtaTemplateHost = templateHttpsHostname(config.primaryCta.href);
  if (primaryCtaTemplateHost) {
    issues.push(`primary CTA still uses ${primaryCtaTemplateHost}`);
  }
  for (const item of config.navigation) {
    const hostname = templateHttpsHostname(item.href);
    if (hostname) {
      issues.push(`navigation item "${item.label}" still uses ${hostname}`);
    }
  }
  for (const [network, href] of Object.entries(config.company.socials)) {
    const hostname = templateHttpsHostname(href);
    if (hostname) issues.push(`company social "${network}" still uses ${hostname}`);
  }
  if (!config.seo.defaultTitle.trim() || !config.seo.defaultDescription.trim()) {
    issues.push("default SEO title and description are required");
  }
  if (!config.seo.titleTemplate.includes("%s")) {
    issues.push("seo.titleTemplate must include %s");
  }
  if (!hasSiteIcon(root)) {
    issues.push("a site icon is required before production");
  }
  if (
    !config.seo.defaultOgImage &&
    !hasMetadataAsset(root, "opengraph-image")
  ) {
    issues.push("a default Open Graph image is required before production");
  }

  const publishableByCollection = Object.fromEntries(
    primaryCollectionKeys.map((collection) => [
      collection,
      config.resourceCollections[collection]
        ? repository.resources[collection].filter(
            (resource) =>
              resource.status === "published" ||
              resource.status === "scheduled",
          )
        : [],
    ]),
  ) as Record<(typeof primaryCollectionKeys)[number], ResourceRecord[]>;
  const publishableResources = Object.values(publishableByCollection).flat();
  const publishableFaqs = config.resourceCollections.faqs
    ? repository.faqs.filter(
        (faq) => faq.status === "published" || faq.status === "scheduled",
      )
    : [];
  const allContentEntries = [
    ...Object.values(repository.resources).flat(),
    ...repository.faqs,
    ...repository.authors,
    ...repository.topics,
    ...repository.products,
  ];
  for (const entry of allContentEntries) {
    for (const field of findTemplatePlaceholderPaths(entry)) {
      issues.push(
        `${entry.sourcePath} (${field}): replace the generated template placeholder before production`,
      );
    }
  }

  for (const resource of publishableResources) {
    if ("access" in resource && resource.access === "gated") {
      issues.push(
        `${resource.sourcePath} (access): gated is metadata only; add fulfillment or publish it as open`,
      );
    }
  }

  const appRoutes = collectAppPageRoutes(root);
  const protectedRedirectPaths = new Set(collectProtectedRedirectPaths(root));
  const publishableResourceByUrl = new Map(
    publishableResources.map((resource) => [resource.url, resource]),
  );
  function managedIndexIsAvailable(
    pathname: string,
    availableOn: string,
  ): boolean | undefined {
    for (const collection of primaryCollectionKeys) {
      if (pathname === collectionDefinitions[collection].route) {
        return publishableByCollection[collection].some(
          (resource) => resource.publishedAt <= availableOn,
        );
      }
    }
    if (pathname === "/resources") {
      return publishableResources.some(
        (resource) => resource.publishedAt <= availableOn,
      );
    }
    if (pathname === "/faqs") {
      return publishableFaqs.some((faq) => faq.publishedAt <= availableOn);
    }
    return undefined;
  }

  for (const collection of primaryCollectionKeys) {
    const resources = publishableByCollection[collection];
    if (resources.length === 0) continue;
    const indexRoute = collectionDefinitions[collection].route;
    if (!appRoutes.includes(indexRoute)) {
      issues.push(`publishable ${collection} content requires page route ${indexRoute}`);
    }
    for (const resource of resources) {
      if (protectedRedirectPaths.has(resource.url)) {
        issues.push(
          `${resource.sourcePath}: public resource URL ${resource.url} conflicts with an explicit page, route, metadata asset, or public file`,
        );
      }
      if (!appRoutes.some((route) => matchesAppPageRoute(resource.url, route))) {
        issues.push(`${resource.sourcePath}: no page route renders ${resource.url}`);
      }
    }
  }
  if (publishableResources.length > 0 && !appRoutes.includes("/resources")) {
    issues.push("publishable resources require page route /resources");
  }
  if (publishableFaqs.length > 0 && !appRoutes.includes("/faqs")) {
    issues.push("publishable FAQs require page route /faqs");
  }

  const links = [
    ...config.navigation.map((item) => ({
      label: `navigation item "${item.label}"`,
      href: item.href,
      baseUrl: config.company.url,
      availableOn: today,
    })),
    ...(config.primaryCta.href
      ? [{
          label: "primary CTA",
          href: config.primaryCta.href,
          baseUrl: config.company.url,
          availableOn: today,
        }]
      : []),
    ...repository.products.flatMap((product) =>
      product.productPageUrl
        ? [{
            label: `product "${product.name}"`,
            href: product.productPageUrl,
            baseUrl: config.company.url,
            availableOn: today,
          }]
        : [],
    ),
    ...publishableResources.flatMap((resource) => {
      const markdown = [resource.body];
      if (resource.collection === "caseStudies") {
        markdown.push(resource.challenge, resource.solution, resource.results);
      }
      return markdown.flatMap((body) =>
        collectMarkdownLinks(body).map((href) => ({
          label: `${resource.sourcePath} Markdown link`,
          href,
          baseUrl: new URL(resource.url, config.company.url).toString(),
          availableOn: isPublicStatus(
            resource.status,
            resource.publishedAt,
            now,
          )
            ? today
            : resource.publishedAt,
        })),
      );
    }),
    ...publishableFaqs.flatMap((faq) =>
      collectMarkdownLinks(faq.body).map((href) => ({
        label: `${faq.sourcePath} Markdown link`,
        href,
        baseUrl: new URL(`/faqs#${faq.slug}`, config.company.url).toString(),
        availableOn: isPublicStatus(faq.status, faq.publishedAt, now)
          ? today
          : faq.publishedAt,
      })),
    ),
  ];

  for (const link of links) {
    const pathname = internalPath(link.href, config.company.url, link.baseUrl);
    if (!pathname) continue;

    if (!appRoutes.some((route) => matchesAppPageRoute(pathname, route))) {
      issues.push(`${link.label} points to missing route ${pathname}`);
      continue;
    }

    for (const collection of primaryCollectionKeys) {
      const route = collectionDefinitions[collection].route;
      const availableResources = publishableByCollection[collection].filter(
        (resource) => resource.publishedAt <= link.availableOn,
      );
      if (pathname === route && availableResources.length === 0) {
        issues.push(`${link.label} points to empty or disabled collection ${route}`);
      } else if (
        pathname.startsWith(`${route}/`) &&
        !protectedRedirectPaths.has(pathname) &&
        (!publishableResourceByUrl.has(pathname) ||
          publishableResourceByUrl.get(pathname)!.publishedAt > link.availableOn)
      ) {
        issues.push(`${link.label} points to unpublished resource ${pathname}`);
      }
    }

    if (
      pathname === "/resources" &&
      !publishableResources.some(
        (resource) => resource.publishedAt <= link.availableOn,
      )
    ) {
      issues.push(`${link.label} points to an empty resources page`);
    }
    if (
      pathname === "/faqs" &&
      !publishableFaqs.some((faq) => faq.publishedAt <= link.availableOn)
    ) {
      issues.push(`${link.label} points to an empty or disabled FAQ page`);
    }
  }

  for (const resource of publishableResources) {
    for (const source of resource.redirectFrom) {
      if (protectedRedirectPaths.has(source)) {
        issues.push(
          `${resource.sourcePath}: redirect source ${source} conflicts with a current page, route, or public file`,
        );
      }
    }
  }

  for (const filePath of pageFiles(path.join(root, "src", "app"))) {
    if (fs.readFileSync(filePath, "utf8").includes("data-template-page")) {
      issues.push(`${path.relative(root, filePath)} still contains a template marker`);
    }
  }

  if (
    (publishableResources.length > 0 || config.seo.defaultOgImage) &&
    isTemplateHostname(config.media.hostname)
  ) {
    issues.push("media.hostname still uses the template value");
  }

  const mediaUrls: Array<{ label: string; url: string }> = [];
  for (const resource of publishableResources) {
    if (resource.coverImage) {
      mediaUrls.push({
        label: `${resource.sourcePath} (coverImage)`,
        url: resource.coverImage,
      });
    }
    if (resource.collection === "caseStudies" && resource.customerLogo) {
      mediaUrls.push({
        label: `${resource.sourcePath} (customerLogo)`,
        url: resource.customerLogo,
      });
    }
    if (resource.collection === "caseStudies" && resource.pdfUrl) {
      mediaUrls.push({
        label: `${resource.sourcePath} (pdfUrl)`,
        url: resource.pdfUrl,
      });
    }
    if (resource.collection === "guides" && resource.downloadUrl) {
      mediaUrls.push({
        label: `${resource.sourcePath} (downloadUrl)`,
        url: resource.downloadUrl,
      });
    }
    if ("video" in resource && resource.video) {
      if (resource.video.thumbnailUrl) {
        mediaUrls.push({
          label: `${resource.sourcePath} (video.thumbnailUrl)`,
          url: resource.video.thumbnailUrl,
        });
      }
      if (resource.video.transcriptUrl) {
        mediaUrls.push({
          label: `${resource.sourcePath} (video.transcriptUrl)`,
          url: resource.video.transcriptUrl,
        });
      }
      for (const [index, caption] of resource.video.captions.entries()) {
        mediaUrls.push({
          label: `${resource.sourcePath} (video.captions.${index}.url)`,
          url: caption.url,
        });
      }
    }
    if (resource.collection === "videos" && resource.slidesUrl) {
      mediaUrls.push({
        label: `${resource.sourcePath} (slidesUrl)`,
        url: resource.slidesUrl,
      });
    }
  }
  const publicAuthorIds = new Set(
    publishableResources.flatMap((resource) => {
      if (resource.collection === "videos") return resource.speakers;
      return "author" in resource && resource.author ? [resource.author] : [];
    }),
  );
  for (const author of repository.authors) {
    if (publicAuthorIds.has(author.id) && author.photo) {
      mediaUrls.push({ label: `${author.sourcePath} (photo)`, url: author.photo });
    }
  }
  if (config.seo.defaultOgImage) {
    mediaUrls.push({
      label: "seo.defaultOgImage.url",
      url: config.seo.defaultOgImage.url,
    });
  }
  for (const media of mediaUrls) {
    if (new URL(media.url).hostname !== config.media.hostname) {
      issues.push(
        `${media.label}: hostname must match configured media.hostname ${config.media.hostname}`,
      );
    }
  }

  for (const resource of publishableResources) {
    if (!resource.canonicalUrl) continue;
    const canonical = new URL(resource.canonicalUrl);
    if (canonical.origin !== new URL(config.company.url).origin) continue;
    const pathname = canonical.pathname.replace(/\/$/, "") || "/";
    const target = publishableResourceByUrl.get(pathname);
    const availableOn = isPublicStatus(
      resource.status,
      resource.publishedAt,
      now,
    )
      ? today
      : resource.publishedAt;
    const managedIndexAvailable = managedIndexIsAvailable(pathname, availableOn);
    const resolvesToStaticPage =
      appRoutes.some((route) => !route.includes("[") && route === pathname) &&
      managedIndexAvailable !== false;
    if (
      (!target || target.publishedAt > availableOn) &&
      !resolvesToStaticPage
    ) {
      issues.push(
        `${resource.sourcePath} (canonicalUrl): same-site canonical points to missing or unavailable public route ${pathname}`,
      );
      continue;
    }
    if (target || managedIndexAvailable !== undefined) {
      const exactTargetUrl = new URL(pathname, config.company.url).toString();
      if (resource.canonicalUrl !== exactTargetUrl) {
        issues.push(
          `${resource.sourcePath} (canonicalUrl): managed canonical must exactly match ${exactTargetUrl} without a query or trailing slash`,
        );
        continue;
      }
    }
    if (target?.canonicalUrl) {
      const targetOwnUrl = new URL(target.url, config.company.url).toString();
      if (target.canonicalUrl !== targetOwnUrl) {
        issues.push(
          `${resource.sourcePath} (canonicalUrl): canonical chain through ${pathname} is not allowed; managed targets must be self-canonical`,
        );
      }
    }
  }

  const hasPublishableVideo = publishableResources.some(
    (resource) => "video" in resource && Boolean(resource.video),
  );
  const streamCustomerCode =
    process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
  if (
    hasPublishableVideo &&
    !isCloudflareStreamCustomerCode(streamCustomerCode)
  ) {
    issues.push(
      "NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE must be a valid Cloudflare Stream customer code for publishable videos",
    );
  }

  return issues;
}
