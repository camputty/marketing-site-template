export const primaryCollectionKeys = [
  "blog",
  "caseStudies",
  "videos",
  "guides",
  "newsroom",
] as const;

export type PrimaryCollectionKey = (typeof primaryCollectionKeys)[number];

export const primaryCollectionContracts = {
  blog: {
    command: "blog",
    directory: "blog",
    route: "/blog",
    label: "Blog",
    singularLabel: "Article",
    idPrefix: "res",
  },
  caseStudies: {
    command: "case-studies",
    directory: "case-studies",
    route: "/case-studies",
    label: "Case studies",
    singularLabel: "Case study",
    idPrefix: "res",
  },
  videos: {
    command: "videos",
    directory: "videos",
    route: "/videos",
    label: "Videos",
    singularLabel: "Video",
    idPrefix: "res",
  },
  guides: {
    command: "guides",
    directory: "guides",
    route: "/guides",
    label: "Guides and briefs",
    singularLabel: "Guide",
    idPrefix: "res",
  },
  newsroom: {
    command: "newsroom",
    directory: "newsroom",
    route: "/newsroom",
    label: "Newsroom",
    singularLabel: "News",
    idPrefix: "res",
  },
} as const satisfies Record<PrimaryCollectionKey, {
  command: string;
  directory: string;
  route: `/${string}`;
  label: string;
  singularLabel: string;
  idPrefix: string;
}>;

export const supportingContentContracts = {
  faqs: { directory: "faqs", idPrefix: "faq" },
  authors: { directory: "authors", idPrefix: "aut" },
  topics: { directory: "topics", idPrefix: "top" },
  products: { directory: "products", idPrefix: "prd" },
} as const;
