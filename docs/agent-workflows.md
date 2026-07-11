# Agent Workflows

This repository is designed to be operated through a coding agent without a CMS. The agent edits the same explicit pages, configuration, and Markdown that a developer would review in Git.

## Source Of Truth

Use approved company material first. Treat `docs/site-brief.md` as a decision record when the project uses it, `src/config/site.json` as global site configuration, explicit files in `src/app` as the page inventory, and `content` as the publishing repository. Never turn an assumption into a public claim.

## Start Or Rebrand A Site

1. Read `AGENTS.md`, the site brief, approved copy, and available brand assets.
2. Configure company identity, navigation, collections, SEO, media, and the document language in `src/config/site.json`.
3. Build only the required routes in `src/app` and reusable local primitives in `src/components`.
4. Add a root icon and either a configured default Open Graph image or `src/app/opengraph-image.*`.
5. Remove every `data-template-page` marker, run `pnpm readiness`, then run `pnpm check`, `pnpm test:e2e`, and the isolated `pnpm test:configured` publishing smoke test.

## Add Or Change A Marketing Page

- Keep the page explicit in React and server-rendered unless real browser interaction requires a client component.
- Give every indexable page a useful title, description, canonical, and social metadata.
- Add deliberate `noindex` metadata and a sitemap exclusion for utility or campaign pages that should remain private from search.
- Update navigation only after the destination exists. The readiness gate validates configured links; the browser test checks links discoverable from rendered public pages.

## Create And Publish Content

1. Create the file with `pnpm content:new <type> "Title"`. Never hand-author an ID.
2. Replace every generated placeholder and add approved media and relationships by ID.
3. For immediate publication, set `status: published`, set `publishedAt` to the publication date, and set `updatedAt` to the current edit date.
4. For scheduling, set `status: scheduled`, set `publishedAt` to the future date, and leave `updatedAt` as the actual last edit date. Publication occurs on the first deployment on or after that date.
5. Run `pnpm validate`, `pnpm content:history`, and `pnpm readiness` before review.

`access: gated` is intentionally descriptive metadata. Production readiness blocks it until the project implements real fulfillment; direct files and Stream IDs are not access control.

## Change A Published Slug

Keep the ID unchanged. Add the previous full public path to `redirectFrom`, change the slug, and optionally rename the Markdown file to match. `pnpm content:history` compares the working tree with Git and rejects an unpreserved published path.

## Work With Media

Upload public images and downloads to the project’s owned R2 hostname and video to Cloudflare Stream using the organization’s approved credentials and workflow. Record stable HTTPS URLs, useful alt text, intrinsic dimensions, and Stream IDs in content. The baseline deliberately does not provision accounts or keep upload credentials; an agent may add thin project-specific upload commands once the real account and approval model are known.

Inline Markdown media is rejected because it bypasses host, dimension, and accessibility contracts. Add a validated field and an explicit React renderer when an editorial format genuinely needs inline media.

## Add An Integration

Add analytics, forms, CRM, search, localization routing, authentication, or a scheduler only for a confirmed project requirement. Document the owner, data flow, environment variables, failure behavior, privacy impact, and how an agent verifies it. Update the baseline security policy only as narrowly as the integration requires.

## Finish A Change

Preserve unrelated work, inspect the diff, and run the narrowest checks while editing. Before handoff, run `pnpm check`; run `pnpm test:e2e` for shared layouts, navigation, or resource templates; run `pnpm test:configured` after publishing, discovery, media, or readiness changes; and run `pnpm build:production` with production-equivalent environment variables before launch.
