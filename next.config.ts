import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import type { NextConfig } from "next";

import {
  primaryCollectionContracts,
  primaryCollectionKeys,
} from "./src/lib/content/contracts";
import { collectProtectedRedirectPaths } from "./src/lib/routes";
import { isLiteralRedirectPath } from "./src/lib/urls";

// Keep build-time redirect discovery dependency-light and reuse the same
// collection, route, and URL contracts as application validation.
export const redirectCollections = primaryCollectionKeys.map((configKey) => {
  const contract = primaryCollectionContracts[configKey];
  return {
    configKey,
    directory: contract.directory,
    route: contract.route,
  };
});

type SiteFileConfig = {
  resourceCollections: Record<
    (typeof redirectCollections)[number]["configKey"] | "faqs",
    boolean
  >;
  media: { hostname: string };
};

function readSiteFileConfig(root = process.cwd()): SiteFileConfig {
  const configPath = path.join(root, "src", "config", "site.json");
  return JSON.parse(fs.readFileSync(configPath, "utf8")) as SiteFileConfig;
}

function frontmatterDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value : undefined;
}

function isPublicRedirectTarget(
  status: unknown,
  publishedAt: unknown,
  today: string,
): boolean {
  const date = frontmatterDate(publishedAt);
  return (
    (status === "published" || status === "scheduled") &&
    Boolean(date && date <= today)
  );
}

function markdownFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return markdownFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
    })
    .sort();
}

export function contentRedirects(
  root = process.cwd(),
  now = new Date(),
) {
  const config = readSiteFileConfig(root);
  const today = now.toISOString().slice(0, 10);
  const redirects = redirectCollections.flatMap(
    ({ configKey, directory, route }) => {
      if (!config.resourceCollections[configKey]) return [];

      return markdownFiles(path.join(root, "content", directory)).flatMap(
        (filePath) => {
          const source = fs.readFileSync(filePath, "utf8");
          const data = matter(source).data as {
            slug?: unknown;
            status?: unknown;
            publishedAt?: unknown;
            redirectFrom?: unknown;
          };
          if (
            typeof data.slug !== "string" ||
            !Array.isArray(data.redirectFrom) ||
            !isPublicRedirectTarget(data.status, data.publishedAt, today)
          ) {
            return [];
          }

          return data.redirectFrom.flatMap((oldPath) =>
            typeof oldPath === "string" && isLiteralRedirectPath(oldPath)
              ? [
                  {
                    source: oldPath,
                    destination: `${route}/${data.slug}`,
                    permanent: true,
                  },
                ]
              : [],
          );
        },
      );
    },
  );

  const seen = new Map<string, string>();
  const protectedPaths = new Set(collectProtectedRedirectPaths(root));
  for (const redirect of redirects) {
    if (protectedPaths.has(redirect.source)) {
      throw new Error(
        `Content redirect ${redirect.source} conflicts with a current page, route, or public file`,
      );
    }
    const destination = seen.get(redirect.source);
    if (destination && destination !== redirect.destination) {
      throw new Error(
        `Conflicting content redirect ${redirect.source}: ${destination} and ${redirect.destination}`,
      );
    }
    seen.set(redirect.source, redirect.destination);
  }
  return redirects;
}

function readMediaHostname(): string {
  return readSiteFileConfig().media.hostname;
}

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; frame-ancestors 'none'; object-src 'none'",
  },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
] as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
  async redirects() {
    return contentRedirects();
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: readMediaHostname(),
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
