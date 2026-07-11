import type { Metadata } from "next";

import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { Section } from "@/components/section";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "/",
  "Configured Site Fixture",
  "A test-only site that exercises production metadata and discovery.",
  { absoluteTitle: true },
);

export default function HomePage() {
  return (
    <main>
      <Container>
        <Section>
          <Heading as="h1" className="text-4xl sm:text-6xl">
            Configured site fixture
          </Heading>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            This page exists only inside the isolated production smoke test.
          </p>
        </Section>
      </Container>
    </main>
  );
}
