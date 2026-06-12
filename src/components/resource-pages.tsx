import type { Metadata } from "next";
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
  type ResourceRecord,
} from "@/lib/content/repository";
import { absoluteUrl } from "@/lib/site";

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

function resourceJsonLd(resource: ResourceRecord): Record<string, unknown> {
  const type =
    resource.collection === "videos"
      ? "VideoObject"
      : resource.collection === "newsroom"
        ? "NewsArticle"
        : "Article";
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    headline: resource.title,
    description: resource.summary,
    datePublished: resource.publishedAt,
    dateModified: resource.updatedAt,
    url: absoluteUrl(resource.url),
    image: resource.coverImage,
    publisher: {
      "@type": "Organization",
      name: siteConfig.company.name,
      url: siteConfig.company.url,
    },
  };

  if (resource.collection === "videos" && "video" in resource) {
    data.thumbnailUrl = resource.video.thumbnailUrl ?? resource.coverImage;
    data.duration = resource.video.durationSeconds
      ? `PT${resource.video.durationSeconds}S`
      : undefined;
    data.embedUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE
      ? `https://customer-${process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE}.cloudflarestream.com/${resource.video.id}/iframe`
      : undefined;
  }

  return data;
}

function CaseStudySections({ resource }: { resource: ResourceRecord }) {
  if (resource.collection !== "caseStudies" || !("challenge" in resource)) {
    return null;
  }

  return (
    <div className="mt-12 grid gap-10">
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
    </div>
  );
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
            <div className="mt-10">
              <ResourceMedia resource={resource} />
            </div>
            <CaseStudySections resource={resource} />
            {resource.body ? (
              <Prose
                className="mt-12"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(resource.body),
                }}
              />
            ) : null}
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

  const canonical = resource.canonicalUrl ?? absoluteUrl(resource.url);
  return {
    title: resource.seo?.title ?? resource.title,
    description: resource.seo?.description ?? resource.summary,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: resource.seo?.title ?? resource.title,
      description: resource.seo?.description ?? resource.summary,
      publishedTime: resource.publishedAt,
      modifiedTime: resource.updatedAt,
      images: resource.coverImage ? [resource.coverImage] : undefined,
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
