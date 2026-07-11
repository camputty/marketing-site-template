import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildVideoSitemapXml } from "@/app/video-sitemap.xml/route";
import {
  loadContentRepository,
  type ResourceRecord,
} from "@/lib/content/repository";
import { escapeXml } from "@/lib/xml";

describe("escapeXml", () => {
  it("escapes XML-sensitive characters", () => {
    expect(escapeXml(`A & B <C> "D"`)).toBe(
      "A &amp; B &lt;C&gt; &quot;D&quot;",
    );
  });

  it("includes a playable URL in video sitemap entries", () => {
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    const xml = buildVideoSitemapXml(repository.resources.videos, "customer-code");

    expect(xml).toContain("<video:player_loc>");
    expect(xml).toContain(
      "https://customer-customer-code.cloudflarestream.com/fixture-stream-id/iframe",
    );
  });

  it("removes characters that are invalid in XML 1.0", () => {
    expect(escapeXml("Valid\u0000 text\u0008")).toBe("Valid text");
  });

  it("discovers videos embedded in articles, not only the video collection", () => {
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    const video = repository.resources.videos[0];
    if (video.collection !== "videos") throw new Error("Expected video fixture");
    const blog = repository.resources.blog[0];
    if (blog.collection !== "blog") throw new Error("Expected blog fixture");
    const article: ResourceRecord = {
      ...blog,
      video: video.video,
    };
    const xml = buildVideoSitemapXml([article], "customer-code");

    expect(xml).toContain("https://example.com/blog/example-article");
    expect(xml).toContain("fixture-stream-id/iframe");
  });
});
