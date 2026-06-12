import Image from "next/image";
import Link from "next/link";

import type { ResourceRecord } from "@/lib/content/repository";

type ResourceCardProps = {
  resource: ResourceRecord;
};

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className="relative overflow-hidden rounded-lg border bg-background">
      {resource.coverImage &&
      resource.coverImageAlt &&
      resource.coverImageWidth &&
      resource.coverImageHeight ? (
        <Image
          src={resource.coverImage}
          alt={resource.coverImageAlt}
          width={resource.coverImageWidth}
          height={resource.coverImageHeight}
          className="aspect-video w-full object-cover"
        />
      ) : null}
      <div className="p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          {resource.publishedAt}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">
          <Link href={resource.url} className="after:absolute after:inset-0">
            {resource.title}
          </Link>
        </h2>
        <p className="mt-3 leading-7 text-muted">{resource.summary}</p>
      </div>
    </article>
  );
}
