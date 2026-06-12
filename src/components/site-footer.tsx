import { Container } from "@/components/container";
import { siteConfig } from "@/config/site";
import { isSiteConfigured } from "@/lib/site";

export function SiteFooter() {
  if (!isSiteConfigured()) return null;

  return (
    <footer className="mt-auto border-t py-8 text-sm text-muted">
      <Container>
        <p>
          &copy; {new Date().getUTCFullYear()} {siteConfig.company.name}
        </p>
      </Container>
    </footer>
  );
}
