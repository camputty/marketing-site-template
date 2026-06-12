import { getPublishedResources } from "@/lib/content/repository";
import { absoluteUrl, isSiteConfigured } from "@/lib/site";
import { escapeXml } from "@/lib/xml";
import { cloudflareStreamPlayerUrl } from "@/lib/video";

export const dynamic = "force-static";

export function buildVideoSitemapXml(
  videos: ReturnType<typeof getPublishedResources>,
  customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE,
): string {
  const entries = videos
    .map((resource) => {
      if (resource.collection !== "videos" || !("video" in resource)) return "";
      const playerUrl = cloudflareStreamPlayerUrl(resource.video.id, customerCode);
      if (!playerUrl) return "";

      return `<url>
  <loc>${escapeXml(absoluteUrl(resource.url))}</loc>
  <video:video>
    <video:thumbnail_loc>${escapeXml(resource.video.thumbnailUrl ?? resource.coverImage ?? "")}</video:thumbnail_loc>
    <video:title>${escapeXml(resource.title)}</video:title>
    <video:description>${escapeXml(resource.summary)}</video:description>
    <video:player_loc>${escapeXml(playerUrl)}</video:player_loc>
    <video:publication_date>${resource.publishedAt}</video:publication_date>
    ${resource.video.durationSeconds ? `<video:duration>${resource.video.durationSeconds}</video:duration>` : ""}
  </video:video>
</url>`;
    })
    .filter(Boolean)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries}
</urlset>`;
}

export function GET() {
  const videos = getPublishedResources("videos").filter(
    (resource) => resource.collection === "videos",
  );

  if (
    !isSiteConfigured() ||
    videos.length === 0 ||
    !process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE
  ) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(buildVideoSitemapXml(videos), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
