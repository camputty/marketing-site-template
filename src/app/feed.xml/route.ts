import { primaryCollectionKeys } from "@/lib/content/collections";
import { getPublishedResources } from "@/lib/content/repository";
import { absoluteUrl } from "@/lib/site";
import { escapeXml } from "@/lib/xml";
import { siteConfig } from "@/config/site";
import { isSiteConfigured } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const resources = primaryCollectionKeys
    .flatMap((collection) => getPublishedResources(collection))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  if (!isSiteConfigured() || resources.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const items = resources
    .map(
      (resource) => `<item>
  <guid isPermaLink="true">${escapeXml(absoluteUrl(resource.url))}</guid>
  <link>${escapeXml(absoluteUrl(resource.url))}</link>
  <title>${escapeXml(resource.title)}</title>
  <description>${escapeXml(resource.summary)}</description>
  <pubDate>${new Date(`${resource.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
</item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>${escapeXml(siteConfig.seo.defaultTitle)}</title>
  <link>${escapeXml(siteConfig.company.url)}</link>
  <description>${escapeXml(siteConfig.seo.defaultDescription)}</description>
  ${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
