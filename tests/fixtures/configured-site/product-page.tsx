import type { Metadata } from "next";

import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { Section } from "@/components/section";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "/product",
  "Product fixture",
  "A product page used only by the configured production smoke test.",
);

export default function ProductFixturePage() {
  return (
    <main>
      <Container>
        <Section>
          <Heading as="h1" className="text-4xl sm:text-5xl">
            Product fixture
          </Heading>
        </Section>
      </Container>
    </main>
  );
}
