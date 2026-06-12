import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
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

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isSiteConfigured()) return [];

  const pagePaths = new Set(["/"]);
  for (const item of siteConfig.navigation) {
    if (item.href.startsWith("/")) pagePaths.add(item.href);
  }
  const entries: MetadataRoute.Sitemap = [...pagePaths].map((pagePath) => ({
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
