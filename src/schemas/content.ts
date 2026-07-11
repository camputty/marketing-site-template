import { z } from "zod";

import {
  isCanonicalUrl,
  isHttpsAssetUrl,
  isHttpsUrl,
  isInternalPathHref,
  isLiteralRedirectPath,
} from "../lib/urls";

const ulidPattern = "[0-7][0-9A-HJKMNP-TV-Z]{25}";

const nonBlankString = z.string().trim().min(1);
const httpsUrlSchema = z.string().refine(isHttpsUrl, "Use an HTTPS URL.");
const httpsAssetUrlSchema = z
  .string()
  .refine(isHttpsAssetUrl, "Use an HTTPS asset URL without a fragment.");
const canonicalUrlSchema = z
  .string()
  .refine(isCanonicalUrl, "Use an HTTPS canonical URL without a fragment.");
const internalHrefSchema = z
  .string()
  .refine(isInternalPathHref, "Use an internal path, query, or fragment.");

export const idSchema = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_${ulidPattern}$`));

const isoDateSchema = z.preprocess(
  (value) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : value,
  z.iso.date().refine(
    (value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
    "Date must be valid ISO 8601.",
  ),
);

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug.");

const pathSchema = z
  .string()
  .refine(
    isLiteralRedirectPath,
    "Use a literal internal path without a trailing slash, query, fragment, or routing pattern.",
  );

const seoSchema = z.strictObject({
  title: nonBlankString.optional(),
  description: nonBlankString.optional(),
});

export const publicationStatusSchema = z.enum([
  "draft",
  "scheduled",
  "published",
  "archived",
]);

export const videoSchema = z.strictObject({
  provider: z.literal("cloudflare-stream"),
  id: nonBlankString,
  thumbnailUrl: httpsAssetUrlSchema.optional(),
  durationSeconds: z.number().int().positive().max(28_800).optional(),
  transcriptUrl: httpsAssetUrlSchema.optional(),
  captions: z
    .array(
      z.strictObject({
        language: z.string().trim().min(2),
        label: nonBlankString,
        url: httpsAssetUrlSchema,
      }),
    )
    .default([]),
});

const sharedResourceFields = {
  id: idSchema("res"),
  schemaVersion: z.literal(1),
  title: nonBlankString,
  slug: slugSchema,
  summary: nonBlankString,
  coverImage: httpsAssetUrlSchema.optional(),
  coverImageAlt: nonBlankString.optional(),
  coverImageWidth: z.number().int().positive().optional(),
  coverImageHeight: z.number().int().positive().optional(),
  topic: idSchema("top").optional(),
  products: z.array(idSchema("prd")).default([]),
  featured: z.boolean().default(false),
  status: publicationStatusSchema,
  publishedAt: isoDateSchema,
  updatedAt: isoDateSchema,
  seo: seoSchema.optional(),
  canonicalUrl: canonicalUrlSchema.nullable().default(null),
  redirectFrom: z
    .array(pathSchema)
    .refine(
      (paths) => new Set(paths).size === paths.length,
      "redirectFrom paths must be unique.",
    )
    .default([]),
  body: z.string(),
  sourcePath: z.string(),
};

function requirePublishedCover(
  resource: {
    status: z.infer<typeof publicationStatusSchema>;
    coverImage?: string;
    coverImageAlt?: string;
    coverImageWidth?: number;
    coverImageHeight?: number;
  },
  context: z.RefinementCtx,
) {
  if (resource.status !== "published" && resource.status !== "scheduled") {
    return;
  }

  for (const field of [
    "coverImage",
    "coverImageAlt",
    "coverImageWidth",
    "coverImageHeight",
  ] as const) {
    if (!resource[field]) {
      context.addIssue({
        code: "custom",
        path: [field],
        message: `${field} is required for publishable resources.`,
      });
    }
  }
}

function validateVideoDiscovery(
  resource: {
    status: z.infer<typeof publicationStatusSchema>;
    title: string;
    summary: string;
    video?: z.infer<typeof videoSchema>;
  },
  context: z.RefinementCtx,
) {
  if (
    !resource.video ||
    (resource.status !== "published" && resource.status !== "scheduled")
  ) {
    return;
  }
  if (resource.title.length > 100) {
    context.addIssue({
      code: "custom",
      path: ["title"],
      message: "Video titles must be 100 characters or fewer for discovery.",
    });
  }
  if (resource.summary.length > 2_048) {
    context.addIssue({
      code: "custom",
      path: ["summary"],
      message: "Video descriptions must be 2,048 characters or fewer for discovery.",
    });
  }
}

export const blogSchema = z
  .strictObject({
    ...sharedResourceFields,
    author: idSchema("aut").optional(),
    video: videoSchema.optional(),
  })
  .superRefine((resource, context) => {
    requirePublishedCover(resource, context);
    validateVideoDiscovery(resource, context);
    if (
      ["published", "scheduled"].includes(resource.status) &&
      !resource.body.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["body"],
        message: "Publishable articles require body content.",
      });
    }
  });

export const caseStudySchema = z
  .strictObject({
    ...sharedResourceFields,
    customerName: nonBlankString,
    challenge: nonBlankString,
    solution: nonBlankString,
    results: nonBlankString,
    customerLogo: httpsAssetUrlSchema.optional(),
    customerLogoAlt: nonBlankString.optional(),
    customerLogoWidth: z.number().int().positive().optional(),
    customerLogoHeight: z.number().int().positive().optional(),
    featuredQuote: nonBlankString.optional(),
    quoteAttribution: nonBlankString.optional(),
    metrics: z
      .array(
        z.strictObject({
          value: nonBlankString,
          label: nonBlankString,
        }),
      )
      .max(3)
      .default([]),
    video: videoSchema.optional(),
    pdfUrl: httpsAssetUrlSchema.optional(),
  })
  .superRefine((resource, context) => {
    requirePublishedCover(resource, context);
    validateVideoDiscovery(resource, context);
    if (resource.customerLogo) {
      for (const field of [
        "customerLogoAlt",
        "customerLogoWidth",
        "customerLogoHeight",
      ] as const) {
        if (!resource[field]) {
          context.addIssue({
            code: "custom",
            path: [field],
            message: `${field} is required when a customer logo is present.`,
          });
        }
      }
    }
    if (Boolean(resource.featuredQuote) !== Boolean(resource.quoteAttribution)) {
      context.addIssue({
        code: "custom",
        path: [resource.featuredQuote ? "quoteAttribution" : "featuredQuote"],
        message: "A featured quote and its attribution must be provided together.",
      });
    }
  });

export const videoResourceSchema = z
  .strictObject({
    ...sharedResourceFields,
    video: videoSchema,
    access: z.enum(["open", "gated"]),
    format: z.enum([
      "webinar",
      "walkthrough",
      "product-demo",
      "interview",
      "event-recording",
      "explainer",
    ]),
    speakers: z.array(idSchema("aut")).default([]),
    takeaways: z.array(nonBlankString).default([]),
    slidesUrl: httpsAssetUrlSchema.optional(),
  })
  .superRefine((resource, context) => {
    requirePublishedCover(resource, context);
    validateVideoDiscovery(resource, context);
  });

export const guideSchema = z
  .strictObject({
    ...sharedResourceFields,
    format: z.enum([
      "guide",
      "brief",
      "report",
      "white-paper",
      "checklist",
      "playbook",
    ]),
    access: z.enum(["open", "gated"]),
    author: idSchema("aut").optional(),
    downloadUrl: httpsAssetUrlSchema.optional(),
    externalUrl: httpsUrlSchema.optional(),
  })
  .superRefine((resource, context) => {
    requirePublishedCover(resource, context);
    if (
      ["published", "scheduled"].includes(resource.status) &&
      !resource.downloadUrl &&
      !resource.externalUrl
    ) {
      context.addIssue({
        code: "custom",
        path: ["downloadUrl"],
        message: "A publishable guide needs a downloadUrl or externalUrl.",
      });
    }
  });

export const newsroomSchema = z
  .strictObject({
    ...sharedResourceFields,
    newsType: z.enum([
      "press-release",
      "company-news",
      "media-mention",
      "award",
    ]),
    sourceUrl: httpsUrlSchema.optional(),
  })
  .superRefine((resource, context) => {
    requirePublishedCover(resource, context);
    if (resource.newsType === "media-mention" && !resource.sourceUrl) {
      context.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "Media mentions require a sourceUrl.",
      });
    }
    if (
      ["published", "scheduled"].includes(resource.status) &&
      ["press-release", "company-news"].includes(resource.newsType) &&
      resource.body.trim().length < 80
    ) {
      context.addIssue({
        code: "custom",
        path: ["body"],
        message: "Owned newsroom entries require substantive body content.",
      });
    }
  });

export const faqSchema = z.strictObject({
  id: idSchema("faq"),
  schemaVersion: z.literal(1),
  question: nonBlankString,
  slug: slugSchema,
  status: publicationStatusSchema,
  publishedAt: isoDateSchema,
  updatedAt: isoDateSchema,
  topic: idSchema("top").optional(),
  products: z.array(idSchema("prd")).default([]),
  body: nonBlankString,
  sourcePath: z.string(),
});

export const authorSchema = z
  .strictObject({
    id: idSchema("aut"),
    schemaVersion: z.literal(1),
    status: z.enum(["active", "archived"]).default("active"),
    displayName: nonBlankString,
    slug: slugSchema,
    role: nonBlankString.optional(),
    company: nonBlankString.optional(),
    photo: httpsAssetUrlSchema.optional(),
    photoAlt: nonBlankString.optional(),
    photoWidth: z.number().int().positive().optional(),
    photoHeight: z.number().int().positive().optional(),
    linkedInUrl: httpsUrlSchema.optional(),
    body: z.string(),
    sourcePath: z.string(),
  })
  .superRefine((author, context) => {
    if (author.photo) {
      for (const field of ["photoAlt", "photoWidth", "photoHeight"] as const) {
        if (!author[field]) {
          context.addIssue({
            code: "custom",
            path: [field],
            message: `${field} is required when an author photo is present.`,
          });
        }
      }
    }
  });

export const topicSchema = z.strictObject({
  id: idSchema("top"),
  schemaVersion: z.literal(1),
  status: z.enum(["active", "archived"]).default("active"),
  name: nonBlankString,
  slug: slugSchema,
  displayOrder: z.number().int().default(0),
  body: z.string(),
  sourcePath: z.string(),
});

export const productSchema = z.strictObject({
  id: idSchema("prd"),
  schemaVersion: z.literal(1),
  status: z.enum(["active", "archived"]).default("active"),
  name: nonBlankString,
  slug: slugSchema,
  description: nonBlankString.optional(),
  productPageUrl: internalHrefSchema.optional(),
  displayOrder: z.number().int().default(0),
  body: z.string(),
  sourcePath: z.string(),
});

export type Blog = z.infer<typeof blogSchema>;
export type CaseStudy = z.infer<typeof caseStudySchema>;
export type VideoResource = z.infer<typeof videoResourceSchema>;
export type Guide = z.infer<typeof guideSchema>;
export type NewsroomEntry = z.infer<typeof newsroomSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type Author = z.infer<typeof authorSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type Product = z.infer<typeof productSchema>;

export type PrimaryResource =
  | Blog
  | CaseStudy
  | VideoResource
  | Guide
  | NewsroomEntry;
