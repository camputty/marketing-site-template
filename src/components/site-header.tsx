import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { Container } from "@/components/container";
import { siteConfig } from "@/config/site";
import { isSiteConfigured } from "@/lib/site";

export function SiteHeader() {
  if (!isSiteConfigured()) return null;

  return (
    <header className="border-b">
      <Container className="flex min-h-16 flex-wrap items-center justify-between gap-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          {siteConfig.company.name}
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-4 sm:gap-5">
          {siteConfig.navigation.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-muted hover:text-foreground">
              {item.label}
            </Link>
          ))}
          {siteConfig.primaryCta.label && siteConfig.primaryCta.href ? (
            <ButtonLink href={siteConfig.primaryCta.href}>
              {siteConfig.primaryCta.label}
            </ButtonLink>
          ) : null}
        </nav>
      </Container>
    </header>
  );
}
