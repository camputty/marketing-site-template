import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { ulid } from "ulid";

const definitions = {
  blog: { directory: "blog", prefix: "res" },
  "case-studies": { directory: "case-studies", prefix: "res" },
  videos: { directory: "videos", prefix: "res" },
  guides: { directory: "guides", prefix: "res" },
  newsroom: { directory: "newsroom", prefix: "res" },
  faqs: { directory: "faqs", prefix: "faq" },
  authors: { directory: "authors", prefix: "aut" },
  topics: { directory: "topics", prefix: "top" },
  products: { directory: "products", prefix: "prd" },
} as const;

type CollectionName = keyof typeof definitions;

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
    summary: "Replace with a concise summary.",
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
      customerName: "Replace with customer name",
      challenge: "Replace with the challenge.",
      solution: "Replace with the solution.",
      results: "Replace with the results.",
      metrics: [],
    };
  }
  if (collection === "videos") {
    return {
      ...shared,
      video: { provider: "cloudflare-stream", id: "replace-stream-id", captions: [] },
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
    return { id, schemaVersion: 1, displayName: title, slug: slugify(title) };
  }
  if (collection === "topics" || collection === "products") {
    return { id, schemaVersion: 1, name: title, slug: slugify(title), displayOrder: 0 };
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
if (fs.existsSync(target)) {
  console.error(`Refusing to overwrite ${path.relative(process.cwd(), target)}.`);
  process.exit(1);
}

const body = collection === "faqs" ? "Replace with the answer." : "Replace with substantive content.";
fs.writeFileSync(target, matter.stringify(`${body}\n`, resourceData(collection, id, title)));
console.log(`Created ${path.relative(process.cwd(), target)} with ID ${id}.`);
