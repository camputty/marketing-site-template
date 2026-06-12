import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildVideoSitemapXml } from "@/app/video-sitemap.xml/route";
import { loadContentRepository } from "@/lib/content/repository";
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
});
