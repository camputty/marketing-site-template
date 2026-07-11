import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { ulid } from "ulid";

import {
  primaryCollectionContracts,
  primaryCollectionKeys,
  supportingContentContracts,
} from "../src/lib/content/contracts";
import { templatePlaceholders } from "../src/lib/template-placeholders";

const definitions: Record<string, { directory: string; prefix: string }> = {
  ...Object.fromEntries(
    primaryCollectionKeys.map((key) => {
      const contract = primaryCollectionContracts[key];
      return [
        contract.command,
        { directory: contract.directory, prefix: contract.idPrefix },
      ];
    }),
  ),
  ...Object.fromEntries(
    Object.entries(supportingContentContracts).map(([command, contract]) => [
      command,
      { directory: contract.directory, prefix: contract.idPrefix },
    ]),
  ),
};

type CollectionName =
  | (typeof primaryCollectionContracts)[keyof typeof primaryCollectionContracts]["command"]
  | keyof typeof supportingContentContracts;

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function resourceData(collection: CollectionName, id: string, title: string) {
  const today = new Date().toISOString().slice(0, 10);
  const shared = {
    id,
    schemaVersion: 1,
    title,
    slug: slugify(title),
    summary: templatePlaceholders.summary,
    products: [],
    featured: false,
    status: "draft",
    publishedAt: today,
    updatedAt: today,
    canonicalUrl: null,
    redirectFrom: [],
  };

  if (collection === "case-studies") {
    return {
      ...shared,
      customerName: templatePlaceholders.customerName,
      challenge: templatePlaceholders.challenge,
      solution: templatePlaceholders.solution,
      results: templatePlaceholders.results,
      metrics: [],
    };
  }
  if (collection === "videos") {
    return {
      ...shared,
      video: {
        provider: "cloudflare-stream",
        id: templatePlaceholders.streamId,
        captions: [],
      },
      access: "open",
      format: "webinar",
      speakers: [],
      takeaways: [],
    };
  }
  if (collection === "guides") {
    return { ...shared, format: "guide", access: "open" };
  }
  if (collection === "newsroom") {
    return { ...shared, newsType: "company-news" };
  }
  if (collection === "faqs") {
    return {
      id,
      schemaVersion: 1,
      question: title,
      slug: slugify(title),
      status: "draft",
      publishedAt: today,
      updatedAt: today,
      products: [],
    };
  }
  if (collection === "authors") {
    return {
      id,
      schemaVersion: 1,
      status: "active",
      displayName: title,
      slug: slugify(title),
    };
  }
  if (collection === "topics" || collection === "products") {
    return {
      id,
      schemaVersion: 1,
      status: "active",
      name: title,
      slug: slugify(title),
      displayOrder: 0,
    };
  }
  return shared;
}

const [collectionArg, ...titleParts] = process.argv.slice(2);
const collection = collectionArg as CollectionName;
const title = titleParts.join(" ").trim();

if (!definitions[collection] || !title) {
  console.error(
    `Usage: pnpm content:new <${Object.keys(definitions).join("|")}> "Title"`,
  );
  process.exit(1);
}

const definition = definitions[collection];
const id = `${definition.prefix}_${ulid()}`;
const slug = slugify(title);
if (!slug) {
  console.error("The title must produce a non-empty URL slug.");
  process.exit(1);
}

const target = path.join(process.cwd(), "content", definition.directory, `${slug}.md`);
const collectionRoot = path.join(process.cwd(), "content", definition.directory);

function markdownFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
  });
}

const existingSlug = markdownFiles(collectionRoot).find((filePath) => {
  const data = matter(fs.readFileSync(filePath, "utf8")).data as {
    slug?: unknown;
  };
  return data.slug === slug;
});
if (existingSlug) {
  console.error(
    `Refusing to duplicate slug ${slug}; it already exists in ${path.relative(process.cwd(), existingSlug)}.`,
  );
  process.exit(1);
}

const body =
  collection === "faqs"
    ? templatePlaceholders.faqBody
    : templatePlaceholders.body;
try {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    matter.stringify(`${body}\n`, resourceData(collection, id, title)),
    { flag: "wx" },
  );
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === "EEXIST") {
    console.error(`Refusing to overwrite ${path.relative(process.cwd(), target)}.`);
    process.exit(1);
  }
  throw error;
}
console.log(`Created ${path.relative(process.cwd(), target)} with ID ${id}.`);
