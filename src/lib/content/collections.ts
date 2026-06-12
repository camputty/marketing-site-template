import {
  blogSchema,
  caseStudySchema,
  faqSchema,
  guideSchema,
  newsroomSchema,
  videoResourceSchema,
} from "@/schemas/content";

export const primaryCollectionKeys = [
  "blog",
  "caseStudies",
  "videos",
  "guides",
  "newsroom",
] as const;

export type PrimaryCollectionKey = (typeof primaryCollectionKeys)[number];

export const collectionDefinitions = {
  blog: {
    directory: "blog",
    route: "/blog",
    label: "Blog",
    singularLabel: "Article",
    schema: blogSchema,
  },
  caseStudies: {
    directory: "case-studies",
    route: "/case-studies",
    label: "Case studies",
    singularLabel: "Case study",
    schema: caseStudySchema,
  },
  videos: {
    directory: "videos",
    route: "/videos",
    label: "Videos",
    singularLabel: "Video",
    schema: videoResourceSchema,
  },
  guides: {
    directory: "guides",
    route: "/guides",
    label: "Guides and briefs",
    singularLabel: "Guide",
    schema: guideSchema,
  },
  newsroom: {
    directory: "newsroom",
    route: "/newsroom",
    label: "Newsroom",
    singularLabel: "News",
    schema: newsroomSchema,
  },
} as const;

export const supportingCollectionDefinitions = {
  faqs: { directory: "faqs", schema: faqSchema },
} as const;
