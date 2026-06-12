import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { z } from "zod";

import { siteConfig } from "@/config/site";
import {
  collectionDefinitions,
  primaryCollectionKeys,
  type PrimaryCollectionKey,
} from "@/lib/content/collections";
import {
  authorSchema,
  faqSchema,
  productSchema,
  topicSchema,
  type Author,
  type Blog,
  type CaseStudy,
  type Faq,
  type Guide,
  type NewsroomEntry,
  type PrimaryResource,
  type Product,
  type Topic,
  type VideoResource,
} from "@/schemas/content";

const defaultContentRoot = path.join(process.cwd(), "content");

type LocatedResource = { url: string };

export type ResourceRecord =
  | (Blog & LocatedResource & { collection: "blog" })
  | (CaseStudy & LocatedResource & { collection: "caseStudies" })
  | (VideoResource & LocatedResource & { collection: "videos" })
  | (Guide & LocatedResource & { collection: "guides" })
  | (NewsroomEntry & LocatedResource & { collection: "newsroom" });

export type ContentRepository = {
  resources: Record<PrimaryCollectionKey, ResourceRecord[]>;
  faqs: Faq[];
  authors: Author[];
  topics: Topic[];
  products: Product[];
  redirects: Array<{ source: string; destination: string }>;
};

export class ContentValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Content validation failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "ContentValidationError";
  }
}

function markdownFiles(root: string, directory: string): string[] {
  const fullDirectory = path.join(root, directory);
  if (!fs.existsSync(fullDirectory)) return [];

  return fs
    .readdirSync(fullDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(fullDirectory, entry.name))
    .sort();
}

function formatZodError(filePath: string, error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const field = issue.path.length > 0 ? ` (${issue.path.join(".")})` : "";
    return `${path.relative(process.cwd(), filePath)}${field}: ${issue.message}`;
  });
}

function parseDirectory<T>(
  root: string,
  directory: string,
  schema: z.ZodType<T>,
  issues: string[],
): T[] {
  const entries: T[] = [];

  for (const filePath of markdownFiles(root, directory)) {
    try {
      const source = fs.readFileSync(filePath, "utf8");
      const parsed = matter(source);
      const result = schema.safeParse({
        ...parsed.data,
        body: parsed.content.trim(),
        sourcePath: path.relative(process.cwd(), filePath),
      });

      if (!result.success) {
        issues.push(...formatZodError(filePath, result.error));
        continue;
      }

      entries.push(result.data);
    } catch (error) {
      issues.push(
        `${path.relative(process.cwd(), filePath)}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return entries;
}

function addDuplicateIssues(
  values: Array<{ value: string; sourcePath: string }>,
  label: string,
  issues: string[],
) {
  const seen = new Map<string, string>();
  for (const item of values) {
    const firstPath = seen.get(item.value);
    if (firstPath) {
      issues.push(
        `${item.sourcePath}: duplicate ${label} ${item.value}; first used in ${firstPath}`,
      );
    } else {
      seen.set(item.value, item.sourcePath);
    }
  }
}

function validateReferences(repository: ContentRepository, issues: string[]) {
  const authorIds = new Set(repository.authors.map((author) => author.id));
  const topicIds = new Set(repository.topics.map((topic) => topic.id));
  const productIds = new Set(repository.products.map((product) => product.id));

  const entries = [
    ...Object.values(repository.resources).flat(),
    ...repository.faqs,
  ];

  for (const entry of entries) {
    if (entry.topic && !topicIds.has(entry.topic)) {
      issues.push(`${entry.sourcePath}: unknown topic ID ${entry.topic}`);
    }
    for (const product of entry.products) {
      if (!productIds.has(product)) {
        issues.push(`${entry.sourcePath}: unknown product ID ${product}`);
      }
    }
  }

  for (const [collection, resources] of Object.entries(repository.resources)) {
    for (const resource of resources) {
      if ("author" in resource && resource.author && !authorIds.has(resource.author)) {
        issues.push(`${resource.sourcePath}: unknown author ID ${resource.author}`);
      }
      if (collection === "videos" && "speakers" in resource) {
        for (const speaker of resource.speakers) {
          if (!authorIds.has(speaker)) {
            issues.push(`${resource.sourcePath}: unknown speaker ID ${speaker}`);
          }
        }
      }
    }
  }
}

function validatePublicationDates(repository: ContentRepository, issues: string[]) {
  const today = new Date().toISOString().slice(0, 10);
  for (const resource of Object.values(repository.resources).flat()) {
    if (resource.status === "published" && resource.publishedAt > today) {
      issues.push(
        `${resource.sourcePath}: published content cannot have a future publishedAt date`,
      );
    }
    if (resource.updatedAt < resource.publishedAt) {
      issues.push(`${resource.sourcePath}: updatedAt cannot predate publishedAt`);
    }
  }
}

function buildRedirects(
  resources: ResourceRecord[],
  issues: string[],
): Array<{ source: string; destination: string }> {
  const currentPaths = new Set(resources.map((resource) => resource.url));
  const redirects = new Map<string, string>();

  for (const resource of resources) {
    for (const source of resource.redirectFrom) {
      if (source === resource.url) {
        issues.push(`${resource.sourcePath}: redirectFrom contains its current URL`);
      }
      if (currentPaths.has(source)) {
        issues.push(`${resource.sourcePath}: redirect source ${source} is a current URL`);
      }
      const existing = redirects.get(source);
      if (existing && existing !== resource.url) {
        issues.push(
          `${resource.sourcePath}: redirect source ${source} conflicts with ${existing}`,
        );
      }
      redirects.set(source, resource.url);
    }
  }

  for (const [source, destination] of redirects) {
    if (redirects.has(destination)) {
      issues.push(`Redirect chain or loop detected: ${source} -> ${destination}`);
    }
  }

  return [...redirects].map(([source, destination]) => ({ source, destination }));
}

export function loadContentRepository(
  root = defaultContentRoot,
): ContentRepository {
  const issues: string[] = [];
  const resources = {} as Record<PrimaryCollectionKey, ResourceRecord[]>;

  for (const key of primaryCollectionKeys) {
    const definition = collectionDefinitions[key];
    const parsed = parseDirectory(
      root,
      definition.directory,
      definition.schema as z.ZodType<PrimaryResource>,
      issues,
    );
    resources[key] = parsed.map(
      (resource) =>
        ({
          ...resource,
          collection: key,
          url: `${definition.route}/${resource.slug}`,
        }) as ResourceRecord,
    );

    addDuplicateIssues(
      resources[key].map((resource) => ({
        value: resource.slug,
        sourcePath: resource.sourcePath,
      })),
      `${key} slug`,
      issues,
    );
  }

  const faqs = parseDirectory(root, "faqs", faqSchema, issues);
  const authors = parseDirectory(root, "authors", authorSchema, issues);
  const topics = parseDirectory(root, "topics", topicSchema, issues);
  const products = parseDirectory(root, "products", productSchema, issues);
  const allWithIds = [
    ...Object.values(resources).flat(),
    ...faqs,
    ...authors,
    ...topics,
    ...products,
  ];

  addDuplicateIssues(
    allWithIds.map((entry) => ({ value: entry.id, sourcePath: entry.sourcePath })),
    "ID",
    issues,
  );
  addDuplicateIssues(
    authors.map((entry) => ({ value: entry.slug, sourcePath: entry.sourcePath })),
    "author slug",
    issues,
  );
  addDuplicateIssues(
    topics.map((entry) => ({ value: entry.slug, sourcePath: entry.sourcePath })),
    "topic slug",
    issues,
  );
  addDuplicateIssues(
    products.map((entry) => ({ value: entry.slug, sourcePath: entry.sourcePath })),
    "product slug",
    issues,
  );
  addDuplicateIssues(
    faqs.map((entry) => ({ value: entry.slug, sourcePath: entry.sourcePath })),
    "FAQ slug",
    issues,
  );

  const repository: ContentRepository = {
    resources,
    faqs,
    authors,
    topics,
    products,
    redirects: [],
  };

  validateReferences(repository, issues);
  validatePublicationDates(repository, issues);
  repository.redirects = buildRedirects(Object.values(resources).flat(), issues);

  if (issues.length > 0) {
    throw new ContentValidationError(issues);
  }

  return repository;
}

export function isPublicStatus(
  status: PrimaryResource["status"] | Faq["status"],
  publishedAt: string,
  now = new Date(),
): boolean {
  if (status !== "published" && status !== "scheduled") return false;
  return publishedAt <= now.toISOString().slice(0, 10);
}

export function getPublishedResources(
  collection: PrimaryCollectionKey,
  now = new Date(),
): ResourceRecord[] {
  if (!siteConfig.resourceCollections[collection]) return [];

  return loadContentRepository()
    .resources[collection].filter((resource) =>
      isPublicStatus(resource.status, resource.publishedAt, now),
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPublishedResource(
  collection: PrimaryCollectionKey,
  slug: string,
): ResourceRecord | undefined {
  return getPublishedResources(collection).find(
    (resource) => resource.slug === slug,
  );
}

export function getPublishedFaqs(now = new Date()): Faq[] {
  if (!siteConfig.resourceCollections.faqs) return [];
  return loadContentRepository().faqs.filter((faq) =>
    isPublicStatus(faq.status, faq.publishedAt, now),
  );
}
