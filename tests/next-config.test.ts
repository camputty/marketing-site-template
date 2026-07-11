import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import matter from "gray-matter";
import { describe, expect, it } from "vitest";

import { collectionDefinitions } from "@/lib/content/collections";
import { siteConfig } from "@/config/site";
import nextConfig, { contentRedirects, redirectCollections } from "../next.config";

function writeResource(
  root: string,
  collection: string,
  filename: string,
  data: Record<string, unknown>,
) {
  const target = path.join(root, "content", collection, filename);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, matter.stringify("Body\n", data));
}

function writeConfig(root: string) {
  const configPath = path.join(root, "src", "config", "site.json");
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      resourceCollections: {
        blog: true,
        caseStudies: false,
        videos: false,
        guides: false,
        newsroom: false,
        faqs: false,
      },
      media: { hostname: "media.example.com" },
    }),
  );
}

describe("content redirects", () => {
  it("keeps the optimized-image allowlist on the validated media host", () => {
    expect(nextConfig.images?.remotePatterns).toEqual([
      {
        protocol: "https",
        hostname: siteConfig.media.hostname,
        port: "",
        pathname: "/**",
      },
    ]);
  });
  it("keeps build-time collection routing aligned with the content repository", () => {
    expect(
      Object.fromEntries(
        redirectCollections.map(({ configKey, directory, route }) => [
          configKey,
          { directory, route },
        ]),
      ),
    ).toEqual(
      Object.fromEntries(
        Object.entries(collectionDefinitions).map(([key, definition]) => [
          key,
          { directory: definition.directory, route: definition.route },
        ]),
      ),
    );
  });

  it("emits redirects only for public resources in enabled collections", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "marketing-redirects-"));
    writeConfig(root);

    writeResource(root, "blog", "published.md", {
      slug: "published",
      status: "published",
      publishedAt: "2026-06-01",
      redirectFrom: ["/blog/old-published"],
    });
    writeResource(root, "blog", "scheduled.md", {
      slug: "scheduled",
      status: "scheduled",
      publishedAt: "2026-06-10",
      redirectFrom: ["/blog/old-scheduled"],
    });
    writeResource(root, "blog", "future.md", {
      slug: "future",
      status: "scheduled",
      publishedAt: "2026-06-12",
      redirectFrom: ["/blog/old-future"],
    });
    writeResource(root, "blog", "draft.md", {
      slug: "draft",
      status: "draft",
      publishedAt: "2026-06-01",
      redirectFrom: ["/blog/old-draft"],
    });
    writeResource(root, "blog", "archived.md", {
      slug: "archived",
      status: "archived",
      publishedAt: "2026-06-01",
      redirectFrom: ["/blog/old-archived"],
    });
    writeResource(root, "blog", "nested/published.md", {
      slug: "nested-published",
      status: "published",
      publishedAt: "2026-06-01",
      redirectFrom: ["/legacy/nested-published"],
    });
    writeResource(root, "blog", "unsafe.md", {
      slug: "unsafe",
      status: "published",
      publishedAt: "2026-06-01",
      redirectFrom: ["/", "//evil.test", "/blog/:path*"],
    });
    writeResource(root, "case-studies", "disabled.md", {
      slug: "disabled",
      status: "published",
      publishedAt: "2026-06-01",
      redirectFrom: ["/case-studies/old-disabled"],
    });

    try {
      expect(contentRedirects(root, new Date("2026-06-11T12:00:00Z"))).toEqual([
        {
          source: "/legacy/nested-published",
          destination: "/blog/nested-published",
          permanent: true,
        },
        {
          source: "/blog/old-published",
          destination: "/blog/published",
          permanent: true,
        },
        {
          source: "/blog/old-scheduled",
          destination: "/blog/scheduled",
          permanent: true,
        },
      ]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a public redirect that intercepts an explicit page", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "marketing-redirects-"));
    writeConfig(root);
    const pagePath = path.join(root, "src", "app", "about", "page.tsx");
    fs.mkdirSync(path.dirname(pagePath), { recursive: true });
    fs.writeFileSync(pagePath, "export default function Page() { return null; }");
    writeResource(root, "blog", "published.md", {
      slug: "published",
      status: "published",
      publishedAt: "2026-06-01",
      redirectFrom: ["/about"],
    });

    try {
      expect(() =>
        contentRedirects(root, new Date("2026-06-11T12:00:00Z")),
      ).toThrow(
        "Content redirect /about conflicts with a current page, route, or public file",
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a public redirect that intercepts an App Router metadata asset", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "marketing-redirects-"));
    writeConfig(root);
    const iconPath = path.join(root, "src", "app", "icon1.png");
    fs.mkdirSync(path.dirname(iconPath), { recursive: true });
    fs.writeFileSync(iconPath, "icon fixture");
    writeResource(root, "blog", "published.md", {
      slug: "published",
      status: "published",
      publishedAt: "2026-06-01",
      redirectFrom: ["/icon1.png"],
    });

    try {
      expect(() =>
        contentRedirects(root, new Date("2026-06-11T12:00:00Z")),
      ).toThrow(
        "Content redirect /icon1.png conflicts with a current page, route, or public file",
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
