import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { Section } from "@/components/section";
import { isSiteConfigured } from "@/lib/site";

export default function HomePage() {
  if (isSiteConfigured()) {
    return (
      <main data-template-page="replace-home">
        <Container>
          <Section>
            <Heading as="h1" className="text-4xl sm:text-6xl">
              Replace this route with the brand homepage.
            </Heading>
          </Section>
        </Container>
      </main>
    );
  }

  return (
    <main data-template-page="setup">
      <Container className="flex min-h-screen items-center">
        <Section className="max-w-3xl">
          <p className="mb-4 font-mono text-sm uppercase tracking-widest text-muted">
            Agent-native marketing site starter
          </p>
          <Heading as="h1" className="text-4xl sm:text-6xl">
            The stack is ready. The brand is intentionally not.
          </Heading>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Edit <code>src/config/site.json</code> and replace this page with
            the company website. The untouched starter is excluded from search
            and cannot pass the production readiness gate.
          </p>
        </Section>
      </Container>
    </main>
  );
}
