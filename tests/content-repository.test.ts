import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  isPublicStatus,
  loadContentRepository,
} from "@/lib/content/repository";

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
});
