import Image from "next/image";

import type { ResourceRecord } from "@/lib/content/repository";
import { cloudflareStreamPlayerUrl } from "@/lib/video";

type ResourceMediaProps = {
  resource: ResourceRecord;
};

export function ResourceMedia({ resource }: ResourceMediaProps) {
  const isUnfulfilledGate =
    "access" in resource && resource.access === "gated";

  if ("video" in resource && resource.video && !isUnfulfilledGate) {
    const playerUrl = cloudflareStreamPlayerUrl(resource.video.id);
    if (playerUrl) {
      return (
        <div className="aspect-video overflow-hidden rounded-lg bg-black">
          <iframe
            title={resource.title}
            src={playerUrl}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
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
        sizes="(min-width: 1024px) 896px, calc(100vw - 40px)"
        preload
        className="h-auto w-full rounded-lg"
      />
    );
  }

  return null;
}
