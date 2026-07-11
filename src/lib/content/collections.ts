import {
  blogSchema,
  caseStudySchema,
  faqSchema,
  guideSchema,
  newsroomSchema,
  videoResourceSchema,
} from "../../schemas/content";
import { primaryCollectionContracts } from "./contracts";

export { primaryCollectionKeys, type PrimaryCollectionKey } from "./contracts";

export const collectionDefinitions = {
  blog: {
    ...primaryCollectionContracts.blog,
    schema: blogSchema,
  },
  caseStudies: {
    ...primaryCollectionContracts.caseStudies,
    schema: caseStudySchema,
  },
  videos: {
    ...primaryCollectionContracts.videos,
    schema: videoResourceSchema,
  },
  guides: {
    ...primaryCollectionContracts.guides,
    schema: guideSchema,
  },
  newsroom: {
    ...primaryCollectionContracts.newsroom,
    schema: newsroomSchema,
  },
} as const;

export const supportingCollectionDefinitions = {
  faqs: { directory: "faqs", schema: faqSchema },
} as const;
