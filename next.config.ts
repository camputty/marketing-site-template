import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import type { NextConfig } from "next";

const resourceCollections = [
  { directory: "blog", route: "/blog" },
  { directory: "case-studies", route: "/case-studies" },
  { directory: "videos", route: "/videos" },
  { directory: "guides", route: "/guides" },
  { directory: "newsroom", route: "/newsroom" },
] as const;

function contentRedirects() {
  return resourceCollections.flatMap(({ directory, route }) => {
    const collectionPath = path.join(process.cwd(), "content", directory);
    if (!fs.existsSync(collectionPath)) return [];

    return fs
      .readdirSync(collectionPath)
      .filter((name) => name.endsWith(".md"))
      .flatMap((name) => {
        const source = fs.readFileSync(path.join(collectionPath, name), "utf8");
        const data = matter(source).data as {
          slug?: string;
          redirectFrom?: string[];
        };
        if (!data.slug || !Array.isArray(data.redirectFrom)) return [];

        return data.redirectFrom.map((oldPath) => ({
          source: oldPath,
          destination: `${route}/${data.slug}`,
          permanent: true,
        }));
      });
  });
}

function readMediaHostname(): string {
  const configPath = path.join(process.cwd(), "src", "config", "site.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
    media: { hostname: string };
  };
  return config.media.hostname;
}

const nextConfig: NextConfig = {
  async redirects() {
    return contentRedirects();
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: readMediaHostname() }],
  },
};

export default nextConfig;
