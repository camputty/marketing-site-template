import { z } from "zod";

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

const linkSchema = z.string().refine(
  (value) => value === "" || value.startsWith("/") || z.url().safeParse(value).success,
  "Use an internal path or absolute URL.",
);

export const siteConfigSchema = z
  .object({
    company: z.object({
      name: z.string(),
      description: z.string(),
      url: z.url(),
      socials: z.record(z.string(), z.url()),
    }),
    primaryCta: z.object({
      label: z.string(),
      href: linkSchema,
    }),
    navigation: z.array(
      z.object({
        label: z.string().min(1),
        href: linkSchema,
      }),
    ),
    resourceCollections: z.object({
      blog: z.boolean(),
      caseStudies: z.boolean(),
      videos: z.boolean(),
      guides: z.boolean(),
      newsroom: z.boolean(),
      faqs: z.boolean(),
    }),
    seo: z.object({
      defaultTitle: z.string(),
      titleTemplate: z.string(),
      defaultDescription: z.string(),
      defaultOgImage: z.url().nullable(),
    }),
    locales: z.array(z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/)).min(1),
    defaultLocale: z.string(),
    media: z.object({
      hostname: z
        .string()
        .min(1)
        .regex(/^[a-z0-9.-]+$/i, "Use an exact hostname without a protocol."),
    }),
  })
  .superRefine((config, context) => {
    if (!config.locales.includes(config.defaultLocale)) {
      context.addIssue({
        code: "custom",
        path: ["defaultLocale"],
        message: "The default locale must be included in locales.",
      });
    }
  });

export type SiteConfig = z.infer<typeof siteConfigSchema>;

export const siteConfig: SiteConfig = siteConfigSchema.parse(rawConfig);

export function isCollectionEnabled(collection: CollectionKey): boolean {
  return siteConfig.resourceCollections[collection];
}
