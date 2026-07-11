import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import type { ResourceRecord } from "@/lib/content/repository";

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.company.url).toString();
}

export function isSiteConfigured(): boolean {
  const hostname = new URL(siteConfig.company.url).hostname;
  return Boolean(
    siteConfig.company.name.trim() &&
      siteConfig.company.description.trim() &&
      hostname !== "example.com" &&
      !hostname.endsWith(".example.com") &&
      siteConfig.seo.defaultTitle.trim() &&
      siteConfig.seo.defaultDescription.trim(),
  );
}

export function isIndexingEnabled(
  vercelEnvironment = process.env.VERCEL_ENV,
  configured = isSiteConfigured(),
  runtimeEnvironment = process.env.NODE_ENV,
): boolean {
  return (
    configured &&
    runtimeEnvironment === "production" &&
    vercelEnvironment !== "preview" &&
    vercelEnvironment !== "development"
  );
}

export function isDiscoveryEnabled(
  vercelEnvironment = process.env.VERCEL_ENV,
  configured = isSiteConfigured(),
): boolean {
  return (
    configured &&
    vercelEnvironment !== "preview" &&
    vercelEnvironment !== "development"
  );
}

function socialImages(): NonNullable<Metadata["openGraph"]>["images"] {
  const image = siteConfig.seo.defaultOgImage;
  return image
    ? [
        {
          url: image.url,
          alt: image.alt,
          width: image.width,
          height: image.height,
        },
      ]
    : undefined;
}

export function baseMetadata(): Metadata {
  const configured = isSiteConfigured();
  const description = configured
    ? siteConfig.seo.defaultDescription
    : "This marketing site starter has not been configured.";
  const title = configured
    ? siteConfig.seo.defaultTitle
    : "Marketing site starter";
  const images = socialImages();

  return {
    metadataBase: new URL(siteConfig.company.url),
    applicationName: configured ? siteConfig.company.name : undefined,
    title: !configured
      ? title
      : {
          default: siteConfig.seo.defaultTitle,
          template: siteConfig.seo.titleTemplate,
        },
    description,
    robots: !isIndexingEnabled()
      ? { index: false, follow: false, nocache: true }
      : undefined,
    openGraph: configured
      ? {
          type: "website",
          siteName: siteConfig.company.name,
          title,
          description,
          locale: siteConfig.defaultLocale.replace("-", "_"),
          images,
        }
      : undefined,
    twitter: configured
      ? {
          card: images ? "summary_large_image" : "summary",
          title,
          description,
          images: siteConfig.seo.defaultOgImage
            ? [
                {
                  url: siteConfig.seo.defaultOgImage.url,
                  alt: siteConfig.seo.defaultOgImage.alt,
                },
              ]
            : undefined,
        }
      : undefined,
  };
}

export function pageMetadata(
  path: string,
  title: string,
  description: string,
  options: { absoluteTitle?: boolean } = {},
): Metadata {
  if (!isSiteConfigured()) return {};

  const canonical = absoluteUrl(path);
  const images = socialImages();
  return {
    title: options.absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: siteConfig.company.name,
      title,
      description,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: siteConfig.seo.defaultOgImage
        ? [
            {
              url: siteConfig.seo.defaultOgImage.url,
              alt: siteConfig.seo.defaultOgImage.alt,
            },
          ]
        : undefined,
    },
  };
}

export function resourceCanonicalUrl(resource: ResourceRecord): string {
  return resource.canonicalUrl ?? absoluteUrl(resource.url);
}

export function isCanonicalResourcePage(resource: ResourceRecord): boolean {
  return resourceCanonicalUrl(resource) === absoluteUrl(resource.url);
}
