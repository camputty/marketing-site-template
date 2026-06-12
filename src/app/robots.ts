import type { MetadataRoute } from "next";

import { getPublishedResources } from "@/lib/content/repository";
import { absoluteUrl, isSiteConfigured } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!isSiteConfigured()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const sitemaps = [absoluteUrl("/sitemap.xml")];
  if (getPublishedResources("videos").length > 0) {
    sitemaps.push(absoluteUrl("/video-sitemap.xml"));
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: sitemaps,
  };
}
