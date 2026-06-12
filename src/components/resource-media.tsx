import Image from "next/image";

import type { ResourceRecord } from "@/lib/content/repository";

type ResourceMediaProps = {
  resource: ResourceRecord;
};

export function ResourceMedia({ resource }: ResourceMediaProps) {
  if (resource.collection === "videos" && "video" in resource) {
    const customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE;
    if (customerCode) {
      return (
        <div className="aspect-video overflow-hidden rounded-lg bg-black">
          <iframe
            title={resource.title}
            src={`https://customer-${customerCode}.cloudflarestream.com/${resource.video.id}/iframe`}
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
