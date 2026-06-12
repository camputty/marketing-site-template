# Agent Instructions

## Architecture

- Preserve Next.js App Router, TypeScript, Tailwind CSS, Markdown, Zod, GitHub, Vercel, Cloudflare R2, and Cloudflare Stream as the core stack.
- Keep ordinary marketing pages explicit in React. Do not introduce a generic page builder or section schema.
- Keep content and presentation separate. Do not put React components in Markdown.
- Use server components by default and add client components only for real interaction.
- Do not add a CMS, database, admin dashboard, form provider, search service, authentication, or orchestration layer without a demonstrated project requirement.
- Use `docs/site-brief.md` when it helps preserve onboarding decisions; it is not required for every project.

## Publishing

- Create content with `pnpm content:new`; never invent or recycle permanent IDs.
- Keep drafts, archives, and future schedules out of public queries.
- Preserve old paths in `redirectFrom` whenever a published slug changes.
- Store entity relationships by ID, not slug.
- Require stable public media URLs, image dimensions, alt text, and Stream IDs.
- Treat `access: gated` as metadata until an external fulfillment system is explicitly added.

## Completion

- Run `pnpm check` after code or content changes.
- Run `pnpm test:e2e` when shared layouts, navigation, or resource templates change.
- Remove template markers and placeholder identity values before production.
- Never publish fabricated claims, testimonials, customer evidence, citations, or nonfunctional forms.
