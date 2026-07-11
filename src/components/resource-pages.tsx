import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { JsonLd } from "@/components/json-ld";
import { Prose } from "@/components/prose";
import { ResourceCard } from "@/components/resource-card";
import { ResourceMedia } from "@/components/resource-media";
import { Section } from "@/components/section";
import { siteConfig } from "@/config/site";
import {
  collectionDefinitions,
  type PrimaryCollectionKey,
} from "@/lib/content/collections";
import { renderMarkdown } from "@/lib/content/markdown";
import {
  getPublishedResource,
  getPublishedResources,
  getContentRepository,
  type ContentRepository,
  type ResourceRecord,
} from "@/lib/content/repository";
import {
  pageMetadata,
  resourceCanonicalUrl,
} from "@/lib/site";
import { cloudflareStreamPlayerUrl } from "@/lib/video";
import type { VideoResource } from "@/schemas/content";

export function ResourceIndexPage({
  collection,
}: {
  collection: PrimaryCollectionKey;
}) {
  const definition = collectionDefinitions[collection];
  const resources = getPublishedResources(collection);
  if (resources.length === 0) notFound();

  return (
    <main>
      <Container>
        <Section>
          <Heading as="h1" className="text-4xl sm:text-5xl">
            {definition.label}
          </Heading>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </Section>
      </Container>
    </main>
  );
}

export function generateResourceIndexMetadata(
  collection: PrimaryCollectionKey,
): Metadata {
  const definition = collectionDefinitions[collection];
  return pageMetadata(
    definition.route,
    definition.label,
    `Browse ${definition.label.toLowerCase()} from ${siteConfig.company.name}.`,
  );
}

function videoJsonLd(
  resource: ResourceRecord,
  video: VideoResource["video"],
): Record<string, unknown> | undefined {
  if (
    !video ||
    (resource.collection === "videos" && resource.access === "gated")
  ) {
    return undefined;
  }

  return {
    "@type": "VideoObject",
    name: resource.title,
    description: resource.summary,
    thumbnailUrl: video.thumbnailUrl ?? resource.coverImage,
    uploadDate: `${resource.publishedAt}T00:00:00Z`,
    duration: video.durationSeconds ? `PT${video.durationSeconds}S` : undefined,
    embedUrl: cloudflareStreamPlayerUrl(video.id),
  };
}

export function resourceJsonLd(
  resource: ResourceRecord,
  repository: ContentRepository = getContentRepository(),
): Record<string, unknown> {
  const canonical = resourceCanonicalUrl(resource);
  const author =
    "author" in resource && resource.author
      ? repository.authors.find((entry) => entry.id === resource.author)
      : undefined;
  if (resource.collection === "videos" && "video" in resource) {
    const videoData = videoJsonLd(resource, resource.video);
    return {
      "@context": "https://schema.org",
      ...(videoData ?? {
        "@type": "CreativeWork",
        name: resource.title,
        description: resource.summary,
      }),
      url: canonical,
      publisher: {
        "@type": "Organization",
        name: siteConfig.company.name,
        url: siteConfig.company.url,
      },
    };
  }

  const type =
    resource.collection === "newsroom"
        ? "NewsArticle"
        : "Article";
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    headline: resource.title,
    description: resource.summary,
    datePublished: resource.publishedAt,
    dateModified:
      resource.updatedAt > resource.publishedAt
        ? resource.updatedAt
        : resource.publishedAt,
    url: canonical,
    image: resource.coverImage,
    author: author
      ? {
          "@type": "Person",
          name: author.displayName,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: siteConfig.company.name,
      url: siteConfig.company.url,
    },
  };

  if ("video" in resource && resource.video) {
    data.video = videoJsonLd(resource, resource.video);
  }

  return data;
}

function ResourceRelationships({ resource }: { resource: ResourceRecord }) {
  const repository = getContentRepository();
  const authorIds = new Set<string>();
  if ("author" in resource && resource.author) authorIds.add(resource.author);
  if (resource.collection === "videos" && "speakers" in resource) {
    resource.speakers.forEach((speaker) => authorIds.add(speaker));
  }

  const authorsById = new Map(
    repository.authors.map((author) => [author.id, author]),
  );
  const authors = [...authorIds].flatMap((id) => {
    const author = authorsById.get(id);
    return author ? [author] : [];
  });
  const topic = repository.topics.find((entry) => entry.id === resource.topic);
  const productsById = new Map(
    repository.products.map((product) => [product.id, product]),
  );
  const products = resource.products.flatMap((id) => {
    const product = productsById.get(id);
    return product ? [product] : [];
  });

  if (authors.length === 0 && !topic && products.length === 0) return null;

  return (
    <dl className="mt-8 grid gap-4 rounded-lg bg-surface p-5 text-sm sm:grid-cols-3">
      {authors.length > 0 ? (
        <div>
          <dt className="font-semibold">
            {resource.collection === "videos" ? "Speakers" : "Author"}
          </dt>
          <dd className="mt-1 text-muted">
            {authors.map((author) => author.displayName).join(", ")}
          </dd>
        </div>
      ) : null}
      {topic ? (
        <div>
          <dt className="font-semibold">Topic</dt>
          <dd className="mt-1 text-muted">{topic.name}</dd>
        </div>
      ) : null}
      {products.length > 0 ? (
        <div>
          <dt className="font-semibold">Products</dt>
          <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-muted">
            {products.map((product) =>
              product.productPageUrl ? (
                <Link key={product.id} href={product.productPageUrl} className="underline">
                  {product.name}
                </Link>
              ) : (
                <span key={product.id}>{product.name}</span>
              ),
            )}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function ResourceAttributes({ resource }: { resource: ResourceRecord }) {
  const attributes: Array<[string, string]> = [];
  if (resource.collection === "videos") {
    attributes.push(["Format", resource.format], ["Access", resource.access]);
  }
  if (resource.collection === "guides") {
    attributes.push(["Format", resource.format], ["Access", resource.access]);
  }
  if (resource.collection === "newsroom") {
    attributes.push(["Type", resource.newsType]);
  }
  if (attributes.length === 0) return null;

  return (
    <dl className="mt-8 flex flex-wrap gap-6 text-sm">
      {attributes.map(([label, value]) => (
        <div key={label}>
          <dt className="font-semibold">{label}</dt>
          <dd className="mt-1 capitalize text-muted">{value.replaceAll("-", " ")}</dd>
        </div>
      ))}
    </dl>
  );
}

function CaseStudySections({ resource }: { resource: ResourceRecord }) {
  if (resource.collection !== "caseStudies" || !("challenge" in resource)) {
    return null;
  }

  return (
    <div className="mt-12 grid gap-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-muted">
          Customer
        </p>
        <p className="mt-2 text-xl font-semibold">{resource.customerName}</p>
        {resource.customerLogo &&
        resource.customerLogoAlt &&
        resource.customerLogoWidth &&
        resource.customerLogoHeight ? (
          <Image
            src={resource.customerLogo}
            alt={resource.customerLogoAlt}
            width={resource.customerLogoWidth}
            height={resource.customerLogoHeight}
            sizes="320px"
            className="mt-4 h-20 w-auto object-contain"
          />
        ) : null}
      </div>
      {resource.metrics.length > 0 ? (
        <dl className="grid gap-4 sm:grid-cols-3">
          {resource.metrics.map((metric) => (
            <div key={`${metric.value}-${metric.label}`} className="rounded-lg bg-surface p-5">
              <dt className="text-sm text-muted">{metric.label}</dt>
              <dd className="mt-2 text-3xl font-semibold">{metric.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {resource.featuredQuote ? (
        <blockquote className="border-l-4 pl-6 text-xl leading-8">
          <p>“{resource.featuredQuote}”</p>
          {resource.quoteAttribution ? (
            <footer className="mt-3 text-sm text-muted">{resource.quoteAttribution}</footer>
          ) : null}
        </blockquote>
      ) : null}
      {[
        ["Challenge", resource.challenge],
        ["Solution", resource.solution],
        ["Results", resource.results],
      ].map(([title, content]) => (
        <section key={title}>
          <Heading as="h2" className="text-2xl">
            {title}
          </Heading>
          <Prose
            className="mt-4"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </section>
      ))}
      {resource.pdfUrl ? (
        <Link href={resource.pdfUrl} className="font-semibold underline">
          View case study PDF
        </Link>
      ) : null}
    </div>
  );
}

function VideoDetails({ resource }: { resource: ResourceRecord }) {
  if (!("video" in resource) || !resource.video) return null;
  if (resource.collection === "videos" && resource.access === "gated") {
    return (
      <p className="mt-10 text-sm text-muted">
        Access fulfillment has not been configured for this video.
      </p>
    );
  }

  const takeaways = resource.collection === "videos" ? resource.takeaways : [];
  const slidesUrl = resource.collection === "videos" ? resource.slidesUrl : undefined;

  return (
    <div className="mt-10 grid gap-6">
      {takeaways.length > 0 ? (
        <section>
          <Heading as="h2" className="text-2xl">Key takeaways</Heading>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            {takeaways.map((takeaway) => (
              <li key={takeaway}>{takeaway}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {resource.video.transcriptUrl ? (
          <Link href={resource.video.transcriptUrl} className="font-semibold underline">
            Read transcript
          </Link>
        ) : null}
        {slidesUrl ? (
          <Link href={slidesUrl} className="font-semibold underline">
            View slides
          </Link>
        ) : null}
        {resource.video.captions.map((caption) => (
          <Link key={`${caption.language}-${caption.url}`} href={caption.url} className="underline">
            {caption.label} captions
          </Link>
        ))}
      </div>
    </div>
  );
}

function ResourceDestination({ resource }: { resource: ResourceRecord }) {
  if (resource.collection === "guides") {
    if (resource.access === "gated") {
      return (
        <p className="mt-10 text-sm text-muted">
          Access fulfillment has not been configured for this resource.
        </p>
      );
    }
    return (
      <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2">
        {resource.downloadUrl ? (
          <Link href={resource.downloadUrl} className="font-semibold underline">
            Download resource
          </Link>
        ) : null}
        {resource.externalUrl ? (
          <Link href={resource.externalUrl} className="font-semibold underline">
            View resource
          </Link>
        ) : null}
      </div>
    );
  }

  if (resource.collection === "newsroom" && resource.sourceUrl) {
    return (
      <p className="mt-10">
        <Link href={resource.sourceUrl} className="font-semibold underline">
          View original source
        </Link>
      </p>
    );
  }

  return null;
}

export function ResourceDetailPage({
  collection,
  slug,
}: {
  collection: PrimaryCollectionKey;
  slug: string;
}) {
  const resource = getPublishedResource(collection, slug);
  if (!resource) notFound();

  return (
    <main>
      <JsonLd data={resourceJsonLd(resource)} />
      <Container>
        <Section>
          <article className="mx-auto max-w-4xl">
            <p className="font-mono text-sm uppercase tracking-wider text-muted">
              {collectionDefinitions[collection].singularLabel} · {resource.publishedAt}
            </p>
            <Heading as="h1" className="mt-4 text-4xl sm:text-6xl">
              {resource.title}
            </Heading>
            <p className="mt-6 text-xl leading-8 text-muted">{resource.summary}</p>
            <ResourceAttributes resource={resource} />
            <ResourceRelationships resource={resource} />
            <div className="mt-10">
              <ResourceMedia resource={resource} />
            </div>
            <CaseStudySections resource={resource} />
            <VideoDetails resource={resource} />
            {resource.body ? (
              <Prose
                className="mt-12"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(resource.body),
                }}
              />
            ) : null}
            <ResourceDestination resource={resource} />
          </article>
        </Section>
      </Container>
    </main>
  );
}

export function generateResourceMetadata(
  collection: PrimaryCollectionKey,
  slug: string,
): Metadata {
  const resource = getPublishedResource(collection, slug);
  if (!resource) return {};

  const canonical = resourceCanonicalUrl(resource);
  const repository = getContentRepository();
  const author =
    "author" in resource && resource.author
      ? repository.authors.find((entry) => entry.id === resource.author)
      : undefined;
  const images =
    resource.coverImage &&
    resource.coverImageAlt &&
    resource.coverImageWidth &&
    resource.coverImageHeight
      ? [
          {
            url: resource.coverImage,
            alt: resource.coverImageAlt,
            width: resource.coverImageWidth,
            height: resource.coverImageHeight,
          },
        ]
      : undefined;
  const title = resource.seo?.title ?? resource.title;
  const description = resource.seo?.description ?? resource.summary;
  return {
    title,
    description,
    authors: author ? [{ name: author.displayName }] : undefined,
    alternates: { canonical },
    openGraph: {
      type: resource.collection === "videos" ? "video.other" : "article",
      url: canonical,
      title,
      description,
      publishedTime: resource.publishedAt,
      modifiedTime:
        resource.updatedAt > resource.publishedAt
          ? resource.updatedAt
          : resource.publishedAt,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images:
        resource.coverImage && resource.coverImageAlt
          ? [{ url: resource.coverImage, alt: resource.coverImageAlt }]
          : undefined,
    },
  };
}

export function generateResourceStaticParams(
  collection: PrimaryCollectionKey,
): Array<{ slug: string }> {
  return getPublishedResources(collection).map((resource) => ({
    slug: resource.slug,
  }));
}
