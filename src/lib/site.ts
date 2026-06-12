import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.company.url).toString();
}

export function isSiteConfigured(): boolean {
  return Boolean(
    siteConfig.company.name.trim() &&
      siteConfig.company.description.trim() &&
      new URL(siteConfig.company.url).hostname !== "example.com" &&
      siteConfig.seo.defaultTitle.trim() &&
      siteConfig.seo.defaultDescription.trim(),
  );
}

export function baseMetadata(): Metadata {
  const configured = isSiteConfigured();

  return {
    metadataBase: new URL(siteConfig.company.url),
    title: !configured
      ? "Marketing site starter"
      : {
          default: siteConfig.seo.defaultTitle,
          template: siteConfig.seo.titleTemplate,
        },
    description: !configured
      ? "This marketing site starter has not been configured."
      : siteConfig.seo.defaultDescription,
    robots: !configured ? { index: false, follow: false } : undefined,
    openGraph:
      !configured || !siteConfig.seo.defaultOgImage
        ? undefined
        : { images: [siteConfig.seo.defaultOgImage] },
  };
}
