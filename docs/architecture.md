# Architecture

## Fixed Responsibilities

| Layer | Choice | Responsibility |
| --- | --- | --- |
| Application | Next.js App Router + TypeScript | Routing, rendering, metadata, discovery files |
| Styling | Tailwind CSS | Brand-specific tokens, layouts, and local primitives |
| Content | Markdown + frontmatter | Inspectable repository-backed resources |
| Validation | Zod | Build-time content contracts and integrity |
| Media | Cloudflare R2 | Images, documents, audio, transcripts, and downloads |
| Video | Cloudflare Stream | Encoding, playback, thumbnails, and captions |
| Source | GitHub | History, review, approvals, and rollback |
| Hosting | Vercel | Preview and production delivery |

`src/config/site.json` is the canonical project configuration and `src/config/site.ts` validates it strictly, so unknown keys and unsafe URL schemes fail rather than disappearing silently. Content schemas live in `src/schemas/content.ts`; the server-only repository loader in `src/lib/content/repository.ts` validates nested Markdown files and cross-file relationships before exposing a memoized typed snapshot to page selectors.

`docs/site-brief.md` is an optional worksheet for preserving company-specific decisions. Projects may adapt or omit it.

Marketing routes remain normal React files. The starter supplies only a neutral shell and resource templates, allowing each company to choose its own information architecture and visual language.

The optional `seo.defaultOgImage` is a structured object rather than a bare URL so social previews keep their accessibility and dimensions:

```json
{
  "url": "https://media.example.com/social/default.png",
  "alt": "Company name and approved campaign message",
  "width": 1200,
  "height": 630
}
```

Projects may instead use Next.js `opengraph-image.*` files.

## Publishing Model

- `draft` and `archived` entries are never public.
- `scheduled` entries become eligible only after `publishedAt` and a new deployment. No internal scheduler is claimed.
- Resource detail paths and generated feeds are fixed during each build, so a future schedule cannot appear on its own at request time.
- `published` entries cannot use a future publication date.
- Empty or disabled collections return 404 and are omitted from generated discovery files.
- A changed public slug keeps its old full path in `redirectFrom`; Next.js emits a permanent redirect.
- A Git-aware history check rejects edited, deleted, or moved-across-type IDs; published resource slug changes without redirects; and changes to published FAQ fragment IDs.
- Production readiness rejects internal navigation, CTA, and product links that do not resolve to a page or that target private or empty resource routes.
- Exact generated placeholders block production wherever they remain in the content repository, including private drafts.
- Public optimized-image URLs must use the configured HTTPS media hostname, and literal redirects cannot intercept current pages, metadata routes, or public files.
- Vercel preview and development deployments remain `noindex` even after company configuration is complete.

Canonical URLs flow through page metadata, JSON-LD, RSS, and video discovery. A resource whose canonical points elsewhere remains available to readers but is omitted from this site’s sitemap so crawlers do not receive conflicting signals. Same-site canonicals must resolve to real content or an explicit static page before production.

The default sitemap discovers explicit static pages automatically. When a project adds a page that should remain out of search, give that route appropriate `noindex` metadata and exclude it in `src/app/sitemap.ts`; this remains an explicit page decision rather than another page registry.

## Portability

Content stores stable URLs and provider IDs rather than Cloudflare SDK response objects. This keeps contracts portable and avoids requiring provider credentials during local builds.

`defaultLocale` declares the document language. Add supported-locale configuration, locale-aware routes, and localized content lookup together only when a project actually requires multilingual publishing; resource IDs can remain stable across that extension.
