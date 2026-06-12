import Image from "next/image";

import type { ResourceRecord } from "@/lib/content/repository";
import { cloudflareStreamPlayerUrl } from "@/lib/video";

type ResourceMediaProps = {
  resource: ResourceRecord;
};

export function ResourceMedia({ resource }: ResourceMediaProps) {
  if ("video" in resource && resource.video) {
    const playerUrl = cloudflareStreamPlayerUrl(resource.video.id);
    if (playerUrl) {
      return (
        <div className="aspect-video overflow-hidden rounded-lg bg-black">
          <iframe
            title={resource.title}
            src={playerUrl}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  if (
    resource.coverImage &&
    resource.coverImageAlt &&
    resource.coverImageWidth &&
    resource.coverImageHeight
  ) {
    return (
      <Image
        src={resource.coverImage}
        alt={resource.coverImageAlt}
        width={resource.coverImageWidth}
        height={resource.coverImageHeight}
        priority
        className="h-auto w-full rounded-lg"
      />
    );
  }

  return null;
}
