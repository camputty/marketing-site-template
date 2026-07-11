import type { MetadataRoute } from "next";

import {
  collectionDefinitions,
  primaryCollectionKeys,
} from "@/lib/content/collections";
import {
  getPublishedFaqs,
  getPublishedResources,
} from "@/lib/content/repository";
import {
  absoluteUrl,
  isDiscoveryEnabled,
  isCanonicalResourcePage,
} from "@/lib/site";
import { collectStaticPageRoutes } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isDiscoveryEnabled()) return [];

  const managedPaths = new Set([
    "/resources",
    "/faqs",
    ...primaryCollectionKeys.map(
      (collection) => collectionDefinitions[collection].route,
    ),
  ]);
  const pagePaths = collectStaticPageRoutes().filter(
    (pagePath) => !managedPaths.has(pagePath),
  );
  const entries: MetadataRoute.Sitemap = pagePaths.map((pagePath) => ({
    url: absoluteUrl(pagePath),
  }));

  let hasResources = false;
  const allResources = primaryCollectionKeys.flatMap((collection) => {
    const resources = getPublishedResources(collection);
    if (resources.length === 0) return [];
    hasResources = true;

    return [
      { url: absoluteUrl(collectionDefinitions[collection].route) },
      ...resources
        .filter(isCanonicalResourcePage)
        .map((resource) => ({
          url: absoluteUrl(resource.url),
          lastModified:
            resource.updatedAt > resource.publishedAt
              ? resource.updatedAt
              : resource.publishedAt,
        })),
    ];
  });

  if (hasResources) {
    entries.push({ url: absoluteUrl("/resources") }, ...allResources);
  }
  if (getPublishedFaqs().length > 0) {
    entries.push({ url: absoluteUrl("/faqs") });
  }

  return entries;
}
