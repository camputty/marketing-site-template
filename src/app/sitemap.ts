import type { MetadataRoute } from "next";

import {
  collectionDefinitions,
  primaryCollectionKeys,
} from "@/lib/content/collections";
import {
  getPublishedFaqs,
  getPublishedResources,
} from "@/lib/content/repository";
import { absoluteUrl } from "@/lib/site";
import { isSiteConfigured } from "@/lib/site";
import { collectStaticPageRoutes } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isSiteConfigured()) return [];

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

  const allResources = primaryCollectionKeys.flatMap((collection) => {
    const resources = getPublishedResources(collection);
    if (resources.length === 0) return [];

    return [
      { url: absoluteUrl(collectionDefinitions[collection].route) },
      ...resources.map((resource) => ({
        url: absoluteUrl(resource.url),
        lastModified: resource.updatedAt,
      })),
    ];
  });

  if (allResources.length > 0) {
    entries.push({ url: absoluteUrl("/resources") }, ...allResources);
  }
  if (getPublishedFaqs().length > 0) {
    entries.push({ url: absoluteUrl("/faqs") });
  }

  return entries;
}
