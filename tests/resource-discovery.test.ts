import path from "node:path";

import { describe, expect, it } from "vitest";

import { resourceJsonLd } from "@/components/resource-pages";
import { loadContentRepository } from "@/lib/content/repository";

describe("resource discovery metadata", () => {
  it("emits required VideoObject properties", () => {
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    const resource = repository.resources.videos[0];
    if (resource.collection !== "videos") throw new Error("Expected video fixture");
    const data = resourceJsonLd(resource);

    expect(data).toMatchObject({
      "@type": "VideoObject",
      name: resource.title,
      thumbnailUrl: resource.video.thumbnailUrl,
      uploadDate: "2026-06-01T00:00:00Z",
    });
    expect(data).not.toHaveProperty("headline");
  });

  it("uses the declared canonical URL consistently in structured data", () => {
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    const resource = {
      ...repository.resources.blog[0],
      canonicalUrl: "https://publisher.example.test/original-article",
    };

    expect(resourceJsonLd(resource, repository)).toMatchObject({
      url: "https://publisher.example.test/original-article",
      author: { "@type": "Person", name: "Example Author" },
    });
  });

  it("does not expose unfulfilled gated video media in structured data", () => {
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    const resource = repository.resources.videos[0];
    if (resource.collection !== "videos") throw new Error("Expected video fixture");
    resource.access = "gated";

    const data = resourceJsonLd(resource, repository);
    expect(data).toMatchObject({
      "@type": "CreativeWork",
      name: resource.title,
    });
    expect(data).not.toHaveProperty("embedUrl");
    expect(data).not.toHaveProperty("thumbnailUrl");
    expect(JSON.stringify(data)).not.toContain(resource.video.id);
  });
});
