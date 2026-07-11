import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { siteConfig, type SiteConfig } from "@/config/site";
import { loadContentRepository } from "@/lib/content/repository";
import { collectReadinessIssues } from "@/lib/readiness";
import { templatePlaceholders } from "@/lib/template-placeholders";

const temporaryRoots: string[] = [];

function configuredSite(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    ...siteConfig,
    company: {
      ...siteConfig.company,
      name: "Example Company",
      description: "A real company description.",
      url: "https://company.test",
    },
    primaryCta: { label: "Contact us", href: "https://contact.vendor.test/form" },
    navigation: [],
    seo: {
      ...siteConfig.seo,
      defaultTitle: "Example Company",
      defaultDescription: "A real company description.",
    },
    ...overrides,
  };
}

function temporaryApp(source: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "marketing-starter-"));
  temporaryRoots.push(root);
  const target = path.join(root, "src", "app", "page.tsx");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
  fs.writeFileSync(path.join(root, "src", "app", "icon.svg"), "<svg xmlns=\"http://www.w3.org/2000/svg\"/>");
  fs.writeFileSync(path.join(root, "src", "app", "opengraph-image.png"), "image fixture");
  return root;
}

function addPage(root: string, route: string) {
  const target = path.join(root, "src", "app", route, "page.tsx");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, "export default function Page() { return <main>Page</main>; }");
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("production readiness", () => {
  it("rejects obvious starter placeholders", () => {
    const issues = collectReadinessIssues(siteConfig, loadContentRepository());

    expect(issues).toContain("company.name is required");
    expect(issues).toContain("company.url still uses example.com");
    expect(issues.some((issue) => issue.includes("template marker"))).toBe(true);
  });

  it("rejects reserved example hosts in public configuration links", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    const config = configuredSite({
      primaryCta: { label: "Contact us", href: "https://example.org/contact" },
      navigation: [{ label: "Demo", href: "https://demo.example.net" }],
      company: {
        ...configuredSite().company,
        socials: { linkedIn: "https://social.example.com/company" },
      },
    });

    const issues = collectReadinessIssues(config, loadContentRepository(), root);
    expect(issues).toContain("primary CTA still uses example.org");
    expect(issues).toContain(
      'navigation item "Demo" still uses demo.example.net',
    );
    expect(issues).toContain(
      'company social "linkedIn" still uses social.example.com',
    );
  });

  it("accepts a configured page-only project without route registry or media setup", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    const config = configuredSite({ media: { hostname: "media.example.com" } });

    expect(collectReadinessIssues(config, loadContentRepository(), root)).toEqual([]);
  });

  it("rejects a template media host when a page-only site configures social media", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    const config = configuredSite({
      media: { hostname: "media.example.com" },
      seo: {
        ...siteConfig.seo,
        defaultTitle: "Example Company",
        defaultDescription: "A real company description.",
        defaultOgImage: {
          url: "https://media.example.com/social.png",
          alt: "Example Company social card.",
          width: 1200,
          height: 630,
        },
      },
    });

    expect(collectReadinessIssues(config, loadContentRepository(), root)).toContain(
      "media.hostname still uses the template value",
    );
  });

  it("rejects navigation to empty collections", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    addPage(root, "resources");
    const config = configuredSite({
      navigation: [{ label: "Resources", href: "/resources" }],
      resourceCollections: { ...siteConfig.resourceCollections, blog: true },
    });

    expect(collectReadinessIssues(config, loadContentRepository(), root)).toContain(
      'navigation item "Resources" points to an empty resources page',
    );
  });

  it("rejects missing internal routes and accepts route groups", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    addPage(root, "(marketing)/about");

    const valid = configuredSite({
      navigation: [{ label: "About", href: "/about#team" }],
    });
    expect(collectReadinessIssues(valid, loadContentRepository(), root)).toEqual([]);

    const invalid = configuredSite({
      navigation: [{ label: "Missing", href: "/missing" }],
    });
    expect(collectReadinessIssues(invalid, loadContentRepository(), root)).toContain(
      'navigation item "Missing" points to missing route /missing',
    );
  });

  it("rejects generated placeholders in public content", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    repository.resources.blog[0].summary = templatePlaceholders.summary;
    const config = configuredSite({
      media: { hostname: "media.company.test" },
      resourceCollections: {
        ...siteConfig.resourceCollections,
        blog: true,
      },
    });

    expect(collectReadinessIssues(config, repository, root)).toContain(
      "tests/fixtures/content/blog/example-article.md (summary): replace the generated template placeholder before production",
    );
  });

  it("preflights future scheduled content before its publication date", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    addPage(root, "guides");
    addPage(root, "guides/[slug]");
    addPage(root, "resources");
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    const guide = repository.resources.guides[0];
    if (guide.collection !== "guides") throw new Error("Expected guide fixture");
    guide.status = "scheduled";
    guide.publishedAt = "2099-01-01";
    guide.access = "gated";
    guide.body = "Read the [missing future guide](/guides/not-published).";
    const config = configuredSite({
      media: { hostname: "media.example.test" },
      resourceCollections: {
        ...siteConfig.resourceCollections,
        guides: true,
      },
    });

    expect(collectReadinessIssues(config, repository, root)).toContain(
      "tests/fixtures/content/guides/example-guide.md (access): gated is metadata only; add fulfillment or publish it as open",
    );
    expect(collectReadinessIssues(config, repository, root)).toContain(
      "tests/fixtures/content/guides/example-guide.md Markdown link points to unpublished resource /guides/not-published",
    );
  });

  it("requires brand discovery assets", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    fs.rmSync(path.join(root, "src", "app", "icon.svg"));
    fs.rmSync(path.join(root, "src", "app", "opengraph-image.png"));

    const issues = collectReadinessIssues(
      configuredSite(),
      loadContentRepository(),
      root,
    );
    expect(issues).toContain("a site icon is required before production");
    expect(issues).toContain(
      "a default Open Graph image is required before production",
    );
  });

  it("does not mistake similarly named files for Next metadata assets", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    fs.renameSync(
      path.join(root, "src", "app", "icon.svg"),
      path.join(root, "src", "app", "icon.backup.svg"),
    );
    fs.renameSync(
      path.join(root, "src", "app", "opengraph-image.png"),
      path.join(root, "src", "app", "opengraph-image.backup.png"),
    );

    const issues = collectReadinessIssues(
      configuredSite(),
      loadContentRepository(),
      root,
    );
    expect(issues).toContain("a site icon is required before production");
    expect(issues).toContain(
      "a default Open Graph image is required before production",
    );
  });

  it("accepts numbered Next metadata asset variants", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    fs.renameSync(
      path.join(root, "src", "app", "icon.svg"),
      path.join(root, "src", "app", "icon1.svg"),
    );
    fs.renameSync(
      path.join(root, "src", "app", "opengraph-image.png"),
      path.join(root, "src", "app", "opengraph-image1.png"),
    );

    expect(
      collectReadinessIssues(configuredSite(), loadContentRepository(), root),
    ).toEqual([]);
  });

  it("rejects public media that cannot be rendered by the configured image host", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    addPage(root, "blog");
    addPage(root, "blog/[slug]");
    addPage(root, "resources");
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    const config = configuredSite({
      media: { hostname: "media.company.test" },
      resourceCollections: {
        ...siteConfig.resourceCollections,
        blog: true,
      },
    });

    expect(collectReadinessIssues(config, repository, root)).toContain(
      "tests/fixtures/content/blog/example-article.md (coverImage): hostname must match configured media.hostname media.company.test",
    );
  });

  it("validates internal links authored in public Markdown", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    addPage(root, "blog");
    addPage(root, "blog/[slug]");
    addPage(root, "resources");
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    repository.resources.blog[0].body =
      "Read the [unpublished article](/blog/not-published).";
    const config = configuredSite({
      media: { hostname: "media.example.test" },
      resourceCollections: {
        ...siteConfig.resourceCollections,
        blog: true,
      },
    });

    expect(collectReadinessIssues(config, repository, root)).toContain(
      "tests/fixtures/content/blog/example-article.md Markdown link points to unpublished resource /blog/not-published",
    );
  });

  it("rejects a same-site canonical URL that does not identify real content", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    addPage(root, "blog");
    addPage(root, "blog/[slug]");
    addPage(root, "resources");
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    repository.resources.blog[0].canonicalUrl =
      "https://company.test/blog/missing";
    const config = configuredSite({
      media: { hostname: "media.example.test" },
      resourceCollections: {
        ...siteConfig.resourceCollections,
        blog: true,
      },
    });

    expect(collectReadinessIssues(config, repository, root)).toContain(
      "tests/fixtures/content/blog/example-article.md (canonicalUrl): same-site canonical points to missing or unavailable public route /blog/missing",
    );
  });

  it("rejects a canonical target that is unavailable when its source is public", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    for (const route of [
      "blog",
      "blog/[slug]",
      "guides",
      "guides/[slug]",
      "resources",
    ]) {
      addPage(root, route);
    }
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    repository.resources.blog[0].canonicalUrl =
      "https://company.test/guides/example-guide";
    repository.resources.guides[0].status = "scheduled";
    repository.resources.guides[0].publishedAt = "2099-01-01";
    const config = configuredSite({
      media: { hostname: "media.example.test" },
      resourceCollections: {
        ...siteConfig.resourceCollections,
        blog: true,
        guides: true,
      },
    });

    expect(
      collectReadinessIssues(
        config,
        repository,
        root,
        new Date("2026-07-10T00:00:00Z"),
      ),
    ).toContain(
      "tests/fixtures/content/blog/example-article.md (canonicalUrl): same-site canonical points to missing or unavailable public route /guides/example-guide",
    );

    repository.resources.blog[0].canonicalUrl = "https://company.test/guides";
    expect(
      collectReadinessIssues(
        config,
        repository,
        root,
        new Date("2026-07-10T00:00:00Z"),
      ),
    ).toContain(
      "tests/fixtures/content/blog/example-article.md (canonicalUrl): same-site canonical points to missing or unavailable public route /guides",
    );
  });

  it("rejects canonical chains and cycles between managed resources", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    for (const route of [
      "blog",
      "blog/[slug]",
      "guides",
      "guides/[slug]",
      "resources",
      "product",
    ]) {
      addPage(root, route);
    }
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    repository.resources.blog[0].canonicalUrl =
      "https://company.test/guides/example-guide";
    repository.resources.guides[0].canonicalUrl =
      "https://company.test/blog/example-article";
    const config = configuredSite({
      media: { hostname: "media.example.test" },
      resourceCollections: {
        ...siteConfig.resourceCollections,
        blog: true,
        guides: true,
      },
    });

    const issues = collectReadinessIssues(config, repository, root);
    expect(issues).toContain(
      "tests/fixtures/content/blog/example-article.md (canonicalUrl): canonical chain through /guides/example-guide is not allowed; managed targets must be self-canonical",
    );
    expect(issues).toContain(
      "tests/fixtures/content/guides/example-guide.md (canonicalUrl): canonical chain through /blog/example-article is not allowed; managed targets must be self-canonical",
    );
  });

  it("rejects a non-exact managed canonical URL", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    for (const route of ["blog", "blog/[slug]", "resources", "product"]) {
      addPage(root, route);
    }
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    repository.resources.blog[0].canonicalUrl =
      "https://company.test/blog/example-article/";
    const config = configuredSite({
      media: { hostname: "media.example.test" },
      resourceCollections: {
        ...siteConfig.resourceCollections,
        blog: true,
      },
    });

    expect(collectReadinessIssues(config, repository, root)).toContain(
      "tests/fixtures/content/blog/example-article.md (canonicalUrl): managed canonical must exactly match https://company.test/blog/example-article without a query or trailing slash",
    );
  });

  it("rejects a resource slug shadowed by an explicit static route", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    addPage(root, "blog");
    addPage(root, "blog/[slug]");
    addPage(root, "blog/example-article");
    addPage(root, "resources");
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    const config = configuredSite({
      media: { hostname: "media.example.test" },
      resourceCollections: {
        ...siteConfig.resourceCollections,
        blog: true,
      },
    });

    expect(collectReadinessIssues(config, repository, root)).toContain(
      "tests/fixtures/content/blog/example-article.md: public resource URL /blog/example-article conflicts with an explicit page, route, metadata asset, or public file",
    );
  });

  it("rejects malformed Stream customer codes for future publishable videos", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    addPage(root, "videos");
    addPage(root, "videos/[slug]");
    addPage(root, "resources");
    const repository = loadContentRepository(
      path.join(process.cwd(), "tests", "fixtures", "content"),
    );
    repository.resources.videos[0].status = "scheduled";
    repository.resources.videos[0].publishedAt = "2099-01-01";
    const config = configuredSite({
      media: { hostname: "media.example.test" },
      resourceCollections: {
        ...siteConfig.resourceCollections,
        videos: true,
      },
    });
    const previousCode =
      process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
    process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE = " bad code ";

    try {
      expect(collectReadinessIssues(config, repository, root)).toContain(
        "NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE must be a valid Cloudflare Stream customer code for publishable videos",
      );
    } finally {
      if (previousCode === undefined) {
        delete process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
      } else {
        process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE = previousCode;
      }
    }
  });
});
