# Agent Instructions

## Architecture

- Preserve Next.js App Router, TypeScript, Tailwind CSS, Markdown, Zod, GitHub, Vercel, Cloudflare R2, and Cloudflare Stream as the core stack.
- Keep ordinary marketing pages explicit in React. Do not introduce a generic page builder or section schema.
- Keep content and presentation separate. Do not put React components in Markdown.
- Use server components by default and add client components only for real interaction.
- Do not add a CMS, database, admin dashboard, form provider, search service, authentication, or orchestration layer without a demonstrated project requirement.
- Use `docs/site-brief.md` when it helps preserve onboarding decisions; it is not required for every project.
- Read approved source material, `src/config/site.json`, and any active site brief before making public claims or changing information architecture.
- Keep `AGENTS.md` canonical across agent tools; tool-specific instruction files should point here instead of copying it.

## Publishing

- Create content with `pnpm content:new`; never invent or recycle permanent IDs.
- Keep content records in Git after creation; use `status: archived` instead of deleting them so IDs remain permanent.
- Keep drafts, archives, and future schedules out of public queries.
- Preserve old paths in `redirectFrom` whenever a published slug changes.
- Emit redirects only for publicly eligible resources in enabled collections; drafts, archives, and future schedules must not expose redirect destinations.
- Store entity relationships by ID, not slug.
- Require stable public media URLs, image dimensions, alt text, and Stream IDs.
- Treat `access: gated` as metadata until an external fulfillment system is explicitly added.
- Do not place images, video, iframes, or a second `h1` in Markdown bodies; add validated media fields and explicit React rendering when needed.
- Run `pnpm content:history` when an existing content ID, type, filename, or slug changes.
- When adding a static page that should not be indexed, add `noindex` metadata and exclude it from `src/app/sitemap.ts` without introducing a page registry.

## Completion

- Run `pnpm check` after code or content changes.
- Run `pnpm test:e2e` when shared layouts, navigation, or resource templates change.
- Run `pnpm test:configured` when publishing, discovery, media, or production-readiness infrastructure changes.
- Run `pnpm readiness` before a production handoff and `pnpm build:production` with production-equivalent variables before launch.
- Remove template markers, generated content placeholders, and placeholder identity values before production.
- Never publish fabricated claims, testimonials, customer evidence, citations, or nonfunctional forms.
