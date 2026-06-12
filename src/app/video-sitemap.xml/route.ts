import { getPublishedResources } from "@/lib/content/repository";
import { absoluteUrl, isSiteConfigured } from "@/lib/site";
import { escapeXml } from "@/lib/xml";

export function GET() {
  const videos = getPublishedResources("videos").filter(
    (resource) => resource.collection === "videos",
  );

  if (!isSiteConfigured() || videos.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const entries = videos
    .map((resource) => {
      if (resource.collection !== "videos" || !("video" in resource)) return "";
      return `<url>
  <loc>${escapeXml(absoluteUrl(resource.url))}</loc>
  <video:video>
    <video:thumbnail_loc>${escapeXml(resource.video.thumbnailUrl ?? resource.coverImage ?? "")}</video:thumbnail_loc>
    <video:title>${escapeXml(resource.title)}</video:title>
    <video:description>${escapeXml(resource.summary)}</video:description>
    <video:publication_date>${resource.publishedAt}</video:publication_date>
    ${resource.video.durationSeconds ? `<video:duration>${resource.video.durationSeconds}</video:duration>` : ""}
  </video:video>
</url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
