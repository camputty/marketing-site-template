import { notFound } from "next/navigation";

import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { ResourceCard } from "@/components/resource-card";
import { Section } from "@/components/section";
import { primaryCollectionKeys } from "@/lib/content/collections";
import { getPublishedResources } from "@/lib/content/repository";

export const metadata = {
  title: "Resources",
  description: "Browse the latest resources.",
};

export default function ResourcesPage() {
  const resources = primaryCollectionKeys
    .flatMap((collection) => getPublishedResources(collection))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  if (resources.length === 0) notFound();

  return (
    <main>
      <Container>
        <Section>
          <Heading as="h1" className="text-4xl sm:text-5xl">
            Resources
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
