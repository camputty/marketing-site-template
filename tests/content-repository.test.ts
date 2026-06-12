import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import {
  isPublicStatus,
  loadContentRepository,
} from "@/lib/content/repository";
import { newsroomSchema } from "@/schemas/content";

const fixtureRoot = path.join(process.cwd(), "tests", "fixtures", "content");

describe("content repository", () => {
  it("parses and cross-validates every default content type", () => {
    const repository = loadContentRepository(fixtureRoot);

    expect(repository.resources.blog).toHaveLength(1);
    expect(repository.resources.caseStudies).toHaveLength(1);
    expect(repository.resources.videos).toHaveLength(1);
    expect(repository.resources.guides).toHaveLength(1);
    expect(repository.resources.newsroom).toHaveLength(1);
    expect(repository.faqs).toHaveLength(1);
    expect(repository.authors).toHaveLength(1);
    expect(repository.topics).toHaveLength(1);
    expect(repository.products).toHaveLength(1);
    expect(repository.redirects).toEqual([
      { source: "/blog/old-example", destination: "/blog/example-article" },
    ]);
  });

  it("keeps drafts, archives, and future schedules private", () => {
    const now = new Date("2026-06-11T12:00:00Z");
    expect(isPublicStatus("draft", "2026-06-01", now)).toBe(false);
    expect(isPublicStatus("archived", "2026-06-01", now)).toBe(false);
    expect(isPublicStatus("scheduled", "2026-06-12", now)).toBe(false);
    expect(isPublicStatus("scheduled", "2026-06-11", now)).toBe(true);
    expect(isPublicStatus("published", "2026-06-01", now)).toBe(true);
  });

  it("allows incomplete newsroom drafts but enforces substantive publishable entries", () => {
    const source = fs.readFileSync(
      path.join(fixtureRoot, "newsroom", "example-news.md"),
      "utf8",
    );
    const parsed = matter(source);
    const entry = {
      ...parsed.data,
      status: "draft",
      body: "Replace with substantive content.",
      sourcePath: "content/newsroom/example.md",
    };

    expect(newsroomSchema.safeParse(entry).success).toBe(true);
    expect(
      newsroomSchema.safeParse({ ...entry, status: "published" }).success,
    ).toBe(false);
  });

  it("applies publication date rules to FAQs", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "marketing-content-"));
    fs.cpSync(fixtureRoot, root, { recursive: true });
    const faqPath = path.join(root, "faqs", "example-faq.md");
    const source = fs.readFileSync(faqPath, "utf8");
    fs.writeFileSync(
      faqPath,
      source
        .replace("publishedAt: 2026-06-01", "publishedAt: 2099-06-01")
        .replace("updatedAt: 2026-06-02", "updatedAt: 2099-06-02"),
    );

    try {
      expect(() => loadContentRepository(root)).toThrow(
        /published content cannot have a future publishedAt date/,
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
