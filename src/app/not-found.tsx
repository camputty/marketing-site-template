import Link from "next/link";

import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { Section } from "@/components/section";

export default function NotFoundPage() {
  return (
    <main>
      <Container>
        <Section>
          <Heading as="h1" className="text-4xl">
            Page not found
          </Heading>
          <p className="mt-4 text-muted">
            The page is unavailable or has not been enabled.
          </p>
          <Link href="/" className="mt-6 inline-block underline">
            Return home
          </Link>
        </Section>
      </Container>
    </main>
  );
}
