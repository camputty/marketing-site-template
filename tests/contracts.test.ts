import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { siteConfig, siteConfigSchema } from "@/config/site";
import { blogSchema, idSchema, productSchema } from "@/schemas/content";

function blogFixture() {
  const filePath = path.join(
    process.cwd(),
    "tests",
    "fixtures",
    "content",
    "blog",
    "example-article.md",
  );
  const parsed = matter(fs.readFileSync(filePath, "utf8"));
  return {
    ...parsed.data,
    body: parsed.content.trim(),
    sourcePath: "tests/fixtures/content/blog/example-article.md",
  };
}

describe("agent-facing contracts", () => {
  it("rejects unknown configuration and frontmatter fields", () => {
    expect(
      siteConfigSchema.safeParse({ ...siteConfig, defaultOGImage: null }).success,
    ).toBe(false);
    expect(
      blogSchema.safeParse({ ...blogFixture(), canonicalURL: "https://example.test" })
        .success,
    ).toBe(false);
  });

  it("allows only explicit safe URL forms", () => {
    expect(
      siteConfigSchema.safeParse({
        ...siteConfig,
        navigation: [{ label: "Unsafe", href: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
    expect(
      siteConfigSchema.safeParse({
        ...siteConfig,
        navigation: [{ label: "Section", href: "#section" }],
      }).success,
    ).toBe(true);
    expect(
      blogSchema.safeParse({ ...blogFixture(), coverImage: "http://media.test/a.jpg" })
        .success,
    ).toBe(false);
    expect(
      blogSchema.safeParse({
        ...blogFixture(),
        coverImage: "https://media.test/a.jpg?token=temporary",
      }).success,
    ).toBe(false);
    expect(
      blogSchema.safeParse({ ...blogFixture(), redirectFrom: ["//evil.test/post"] })
        .success,
    ).toBe(false);
    expect(
      blogSchema.safeParse({ ...blogFixture(), redirectFrom: ["/blog/:path*"] })
        .success,
    ).toBe(false);
    expect(
      blogSchema.safeParse({
        ...blogFixture(),
        canonicalUrl: "https://example.test:8443/blog/example-article",
      }).success,
    ).toBe(false);
    expect(
      siteConfigSchema.safeParse({
        ...siteConfig,
        company: { ...siteConfig.company, url: "https://example.test:8443" },
      }).success,
    ).toBe(false);
    expect(
      productSchema.safeParse({
        id: "prd_01ARZ3NDEKTSV4RRFFQ69G5FB1",
        schemaVersion: 1,
        name: "Product",
        slug: "product",
        productPageUrl: "//evil.test/product",
        body: "",
        sourcePath: "content/products/product.md",
      }).success,
    ).toBe(false);
  });

  it("rejects overflow ULIDs", () => {
    expect(idSchema("res").safeParse("res_8ZZZZZZZZZZZZZZZZZZZZZZZZZ").success)
      .toBe(false);
  });
});
