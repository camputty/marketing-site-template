import { z } from "zod";

import {
  isHttpsAssetUrl,
  isHttpsUrl,
  isNavigationHref,
  isSiteBaseUrl,
} from "../lib/urls";

import rawConfig from "./site.json";

export const collectionKeys = [
  "blog",
  "caseStudies",
  "videos",
  "guides",
  "newsroom",
  "faqs",
] as const;

export type CollectionKey = (typeof collectionKeys)[number];

const linkSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    isNavigationHref,
    "Use an internal path, HTTPS URL, mailto URL, or tel URL.",
  );

const optionalLinkSchema = z.union([z.literal(""), linkSchema]);
const httpsUrlSchema = z.string().refine(isHttpsUrl, "Use an HTTPS URL.");
const siteBaseUrlSchema = z
  .string()
  .refine(isSiteBaseUrl, "Use an HTTPS site origin without a path, query, or fragment.");
const httpsAssetUrlSchema = z
  .string()
  .refine(isHttpsAssetUrl, "Use an HTTPS asset URL without a fragment.");

export const siteConfigSchema = z
  .strictObject({
    company: z.strictObject({
      name: z.string(),
      description: z.string(),
      url: siteBaseUrlSchema,
      socials: z.record(z.string(), httpsUrlSchema),
    }),
    primaryCta: z.strictObject({
      label: z.string(),
      href: optionalLinkSchema,
    }),
    navigation: z.array(
      z.strictObject({
        label: z.string().trim().min(1),
        href: linkSchema,
      }),
    ),
    resourceCollections: z.strictObject({
      blog: z.boolean(),
      caseStudies: z.boolean(),
      videos: z.boolean(),
      guides: z.boolean(),
      newsroom: z.boolean(),
      faqs: z.boolean(),
    }),
    seo: z.strictObject({
      defaultTitle: z.string(),
      titleTemplate: z.string(),
      defaultDescription: z.string(),
      defaultOgImage: z
        .strictObject({
          url: httpsAssetUrlSchema,
          alt: z.string().trim().min(1),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
        })
        .nullable(),
    }),
    defaultLocale: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
    media: z.strictObject({
      hostname: z
        .string()
        .min(1)
        .regex(/^[a-z0-9.-]+$/i, "Use an exact hostname without a protocol."),
    }),
  })
  .superRefine((config, context) => {
    const navigationHrefs = new Set<string>();
    for (const [index, item] of config.navigation.entries()) {
      if (navigationHrefs.has(item.href)) {
        context.addIssue({
          code: "custom",
          path: ["navigation", index, "href"],
          message: "Navigation destinations must be unique.",
        });
      }
      navigationHrefs.add(item.href);
    }
  });

export type SiteConfig = z.infer<typeof siteConfigSchema>;

export const siteConfig: SiteConfig = siteConfigSchema.parse(rawConfig);

export function isCollectionEnabled(collection: CollectionKey): boolean {
  return siteConfig.resourceCollections[collection];
}
