import type { MetadataRoute } from "next";

import { getPublishedVideoResources } from "@/lib/content/repository";
import {
  absoluteUrl,
  isCanonicalResourcePage,
  isIndexingEnabled,
} from "@/lib/site";
import { isCloudflareStreamCustomerCode } from "@/lib/video";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexingEnabled()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const sitemaps = [absoluteUrl("/sitemap.xml")];
  if (
    isCloudflareStreamCustomerCode(
      process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE,
    ) &&
    getPublishedVideoResources().some(isCanonicalResourcePage)
  ) {
    sitemaps.push(absoluteUrl("/video-sitemap.xml"));
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: sitemaps,
  };
}
