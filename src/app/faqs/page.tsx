import { notFound } from "next/navigation";

import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { Prose } from "@/components/prose";
import { Section } from "@/components/section";
import { renderMarkdown } from "@/lib/content/markdown";
import { getPublishedFaqs } from "@/lib/content/repository";

export const metadata = {
  title: "Frequently asked questions",
  description: "Answers to frequently asked questions.",
};

export default function FaqsPage() {
  const faqs = getPublishedFaqs();
  if (faqs.length === 0) notFound();

  return (
    <main>
      <Container>
        <Section>
          <Heading as="h1" className="text-4xl sm:text-5xl">
            Frequently asked questions
          </Heading>
          <div className="mt-10 max-w-3xl divide-y">
            {faqs.map((faq) => (
              <section key={faq.id} id={faq.slug} className="py-8 first:pt-0">
                <Heading as="h2" className="text-xl">
                  {faq.question}
                </Heading>
                <Prose
                  className="mt-4"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(faq.body) }}
                />
              </section>
            ))}
          </div>
        </Section>
      </Container>
    </main>
  );
}
