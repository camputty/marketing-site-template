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

`src/config/site.json` is the canonical project configuration and `src/config/site.ts` validates it. Content schemas live in `src/schemas/content.ts`; the server-only repository loader in `src/lib/content/repository.ts` parses each file once per query and validates cross-file relationships before exposing typed records.

`docs/site-brief.md` is an optional worksheet for preserving company-specific decisions. Projects may adapt or omit it.

Marketing routes remain normal React files. The starter supplies only a neutral shell and resource templates, allowing each company to choose its own information architecture and visual language.

## Publishing Model

- `draft` and `archived` entries are never public.
- `scheduled` entries become eligible only after `publishedAt` and a new deployment. No internal scheduler is claimed.
- `published` entries cannot use a future publication date.
- Empty or disabled collections return 404 and are omitted from generated discovery files.
- A changed public slug keeps its old full path in `redirectFrom`; Next.js emits a permanent redirect.

## Portability

Content stores stable URLs and provider IDs rather than Cloudflare SDK response objects. This keeps contracts portable and avoids requiring provider credentials during local builds.

Localization is declared in site configuration but multilingual routing is intentionally not implemented until a project requires it. At that point, add locale-aware routes and content lookup without changing the underlying resource identity model.
