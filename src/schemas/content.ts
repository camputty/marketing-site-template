import { z } from "zod";

const ulidPattern = "[0-9A-HJKMNP-TV-Z]{26}";

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
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug.");

const pathSchema = z.string().startsWith("/").refine(
  (value) => value === "/" || !value.endsWith("/"),
  "Redirect paths must not end in a slash.",
);

const seoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

export const publicationStatusSchema = z.enum([
  "draft",
  "scheduled",
  "published",
  "archived",
]);

export const videoSchema = z.object({
  provider: z.literal("cloudflare-stream"),
  id: z.string().min(1),
  thumbnailUrl: z.url().optional(),
  durationSeconds: z.number().int().positive().optional(),
  transcriptUrl: z.url().optional(),
  captions: z
    .array(
      z.object({
        language: z.string().min(2),
        label: z.string().min(1),
        url: z.url(),
      }),
    )
    .default([]),
});

const sharedResourceFields = {
  id: idSchema("res"),
  schemaVersion: z.literal(1),
  title: z.string().min(1),
  slug: slugSchema,
  summary: z.string().min(1),
  coverImage: z.url().optional(),
  coverImageAlt: z.string().min(1).optional(),
  coverImageWidth: z.number().int().positive().optional(),
  coverImageHeight: z.number().int().positive().optional(),
  topic: idSchema("top").optional(),
  products: z.array(idSchema("prd")).default([]),
  featured: z.boolean().default(false),
  status: publicationStatusSchema,
  publishedAt: isoDateSchema,
  updatedAt: isoDateSchema,
  seo: seoSchema.optional(),
  canonicalUrl: z.url().nullable().default(null),
  redirectFrom: z.array(pathSchema).default([]),
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

export const blogSchema = z
  .object({
    ...sharedResourceFields,
    author: idSchema("aut").optional(),
    video: videoSchema.optional(),
  })
  .superRefine(requirePublishedCover);

export const caseStudySchema = z
  .object({
    ...sharedResourceFields,
    customerName: z.string().min(1),
    challenge: z.string().min(1),
    solution: z.string().min(1),
    results: z.string().min(1),
    customerLogo: z.url().optional(),
    customerLogoAlt: z.string().min(1).optional(),
    featuredQuote: z.string().min(1).optional(),
    quoteAttribution: z.string().min(1).optional(),
    metrics: z
      .array(
        z.object({
          value: z.string().min(1),
          label: z.string().min(1),
        }),
      )
      .max(3)
      .default([]),
    video: videoSchema.optional(),
    pdfUrl: z.url().optional(),
  })
  .superRefine((resource, context) => {
    requirePublishedCover(resource, context);
    if (resource.customerLogo && !resource.customerLogoAlt) {
      context.addIssue({
        code: "custom",
        path: ["customerLogoAlt"],
        message: "Customer logo alt text is required when a logo is present.",
      });
    }
  });

export const videoResourceSchema = z
  .object({
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
    takeaways: z.array(z.string().min(1)).default([]),
    slidesUrl: z.url().optional(),
  })
  .superRefine(requirePublishedCover);

export const guideSchema = z
  .object({
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
    downloadUrl: z.url().optional(),
    externalUrl: z.url().optional(),
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
  .object({
    ...sharedResourceFields,
    newsType: z.enum([
      "press-release",
      "company-news",
      "media-mention",
      "award",
    ]),
    sourceUrl: z.url().optional(),
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

export const faqSchema = z.object({
  id: idSchema("faq"),
  schemaVersion: z.literal(1),
  question: z.string().min(1),
  slug: slugSchema,
  status: publicationStatusSchema,
  publishedAt: isoDateSchema,
  updatedAt: isoDateSchema,
  topic: idSchema("top").optional(),
  products: z.array(idSchema("prd")).default([]),
  body: z.string().min(1),
  sourcePath: z.string(),
});

export const authorSchema = z
  .object({
    id: idSchema("aut"),
    schemaVersion: z.literal(1),
    displayName: z.string().min(1),
    slug: slugSchema,
    role: z.string().min(1).optional(),
    company: z.string().min(1).optional(),
    photo: z.url().optional(),
    photoAlt: z.string().min(1).optional(),
    linkedInUrl: z.url().optional(),
    body: z.string(),
    sourcePath: z.string(),
  })
  .superRefine((author, context) => {
    if (author.photo && !author.photoAlt) {
      context.addIssue({
        code: "custom",
        path: ["photoAlt"],
        message: "Author photo alt text is required when a photo is present.",
      });
    }
  });

export const topicSchema = z.object({
  id: idSchema("top"),
  schemaVersion: z.literal(1),
  name: z.string().min(1),
  slug: slugSchema,
  displayOrder: z.number().int().default(0),
  body: z.string(),
  sourcePath: z.string(),
});

export const productSchema = z.object({
  id: idSchema("prd"),
  schemaVersion: z.literal(1),
  name: z.string().min(1),
  slug: slugSchema,
  description: z.string().min(1).optional(),
  productPageUrl: z.string().startsWith("/").optional(),
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
