# Launch Checklist

## Site

- Confirm any project brief or planning document reflects the approved launch decisions.
- Replace the starter homepage and implement the intended routes.
- Apply the company’s design tokens, typography, imagery, navigation, and responsive behavior.
- Remove placeholder domains and configure the production URL, CTA, SEO defaults, and social profiles. Configure the media hostname when the project publishes repository resources.
- Add a recognizable site icon and a tested 1200×630 social preview with real alt text and dimensions.

## Content

- Validate every published resource and internal entity reference.
- Confirm drafts, archives, and future schedules remain private.
- Confirm redirects preserve changed public URLs without chains or conflicts.
- Confirm images have stable URLs, dimensions, rights information, and useful alt text.
- Confirm videos have stable playback data, captions, and crawlable transcripts when available.
- Confirm no resource says `access: gated` until signed playback or download fulfillment is actually implemented.
- Remove unsupported claims, fabricated proof, placeholder copy, and fake forms.

## Discovery

- Inspect titles, descriptions, canonicals, Open Graph data, JSON-LD, sitemap files, RSS, and robots rules.
- Add FAQ structured data at the project level only when the visible page and current search guidance support it.
- Verify crawler policy against current official guidance.
- Submit applicable sitemaps and configure IndexNow only when credentials and workflow exist.

## Quality

- Run `pnpm check` and `pnpm test:e2e`.
- Review representative pages at mobile and desktop widths.
- Complete a manual keyboard pass and verify focus, contrast, headings, landmarks, captions, and descriptive links.
- Run `pnpm build:production` with production-equivalent environment variables.

## Operations

- Configure least-privilege GitHub, Vercel, and Cloudflare access.
- Enable GitHub private vulnerability reporting or publish a real private security contact.
- Confirm preview review and production approval expectations.
- Document scheduled deployment triggers and media backups.
- Monitor failed builds, indexing, crawler blocks, and Core Web Vitals after launch.
