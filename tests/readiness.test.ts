import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { siteConfig, type SiteConfig } from "@/config/site";
import { loadContentRepository } from "@/lib/content/repository";
import { collectReadinessIssues } from "@/lib/readiness";

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
    primaryCta: { label: "Contact us", href: "https://example.org/contact" },
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

  it("accepts a configured page-only project without route registry or media setup", () => {
    const root = temporaryApp(
      "export default function Page() { return <main>Company home</main>; }",
    );
    const config = configuredSite({ media: { hostname: "media.example.com" } });

    expect(collectReadinessIssues(config, loadContentRepository(), root)).toEqual([]);
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
});
