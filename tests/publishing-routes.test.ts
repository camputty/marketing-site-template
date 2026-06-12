import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("deployment-bound publishing", () => {
  it("disables runtime generation for resource detail routes", () => {
    for (const collection of [
      "blog",
      "case-studies",
      "videos",
      "guides",
      "newsroom",
    ]) {
      const source = fs.readFileSync(
        path.join(process.cwd(), "src", "app", collection, "[slug]", "page.tsx"),
        "utf8",
      );
      expect(source).toContain("export const dynamicParams = false");
    }
  });

  it("builds discovery feeds once per deployment", () => {
    for (const route of ["feed.xml", "video-sitemap.xml"]) {
      const source = fs.readFileSync(
        path.join(process.cwd(), "src", "app", route, "route.ts"),
        "utf8",
      );
      expect(source).toContain('export const dynamic = "force-static"');
    }
  });
});
