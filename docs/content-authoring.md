# Content Authoring

## Create A Draft

```bash
pnpm content:new blog "How the system works"
pnpm content:new case-studies "Customer outcome"
pnpm content:new videos "Product walkthrough"
```

The command generates a permanent prefixed ULID and refuses to overwrite an existing slug. Supporting entities use `authors`, `topics`, and `products`. IDs may also be generated with `pnpm content:id res`.

## Shared Resource Fields

```yaml
id: res_01J...
schemaVersion: 1
title: Resource title
slug: resource-title
summary: A concise card and metadata summary.
coverImage: https://media.example.com/resources/image.webp
coverImageAlt: Descriptive alternative text.
coverImageWidth: 1200
coverImageHeight: 630
topic: top_01J...
products:
  - prd_01J...
featured: false
status: draft
publishedAt: 2026-06-11
updatedAt: 2026-06-11
canonicalUrl: null
redirectFrom: []
```

Publishable primary resources require cover media, alt text, and dimensions. Resource-specific fields are enforced in `src/schemas/content.ts`.
Drafts may retain incomplete working copy, but publishable owned newsroom entries require substantive body content.
Before production, replace the exact generated placeholder values created by `pnpm content:new` even in private drafts; the readiness gate enforces this invariant across the repository.

Schemas are strict: an unknown or misspelled field is an error. Content may be organized in nested folders under its collection; public URLs continue to use the validated slug.

## Collection Fields

| Type | Additional fields |
| --- | --- |
| Blog | Optional `author` ID and optional `video` |
| Case study | `customerName`, `challenge`, `solution`, `results`; optional metrics, attributed quote, logo with dimensions, video, and PDF |
| Video | `video`, `access`, `format`; optional speaker IDs, takeaways, and slides |
| Guide | `format`, `access`, and a publishable `downloadUrl` or `externalUrl`; optional author ID |
| Newsroom | `newsType`; media mentions require `sourceUrl` |
| FAQ | `question`, lifecycle dates, optional topic/product IDs, and answer body |
| Author | `status`, `displayName`, slug, optional role/company, and optional photo with alt text and dimensions |
| Topic | `status`, `name`, slug, and `displayOrder` |
| Product | `status`, `name`, slug, optional description/internal page URL, and `displayOrder` |

`featured` and supporting-entity `displayOrder` are extension metadata for explicit pages to use when the project needs them; the baseline does not impose a homepage or taxonomy layout.

## Identity And URLs

- Never edit an ID after creation or reuse an ID from deleted content.
- Do not delete a content record after creating it. Set lifecycle content to `status: archived`; supporting entities use `status: archived` instead of `active`. This keeps every permanent ID reserved in Git history.
- Reference authors, topics, and products by ID.
- Keep IDs out of public URLs.
- Once a resource has been committed, changing its slug requires the old full path in `redirectFrom`; this remains true through draft or archive transitions, and every earlier redirect must remain in the list.
- Once committed, FAQ slugs are immutable fragment IDs; create a new FAQ if the public anchor must change.
- Run `pnpm content:history` to compare IDs and published paths with the Git base.

## Media

Use immutable or versioned HTTPS URLs on the configured public R2 hostname. Store source, rights, attribution, and ownership notes in the project when relevant. Videos use a Cloudflare Stream ID; captions and transcripts remain stable public assets. Do not commit long-form source video to Git.

Markdown bodies may contain prose, Markdown-syntax internal/relative or HTTPS links, lists, tables, quotes, and code, but not raw HTML links, a second level-one heading, or inline image/video/iframe markup. Inline media needs a project-specific validated field and explicit React renderer so host, dimensions, accessibility, and link preflight remain enforceable.

`access: gated` does not secure a public URL. Production readiness rejects it until the project implements signed media or download fulfillment.

## Scheduled Content

A future `scheduled` entry remains private. Dates are calendar dates evaluated in UTC. Set `publishedAt` to the intended publication date and keep `updatedAt` as the real last edit date. The entry becomes public only when the date has arrived and an external action triggers a new deployment. Use Vercel Deploy Hooks, GitHub Actions, or another explicit scheduler when a project needs automatic publication.

## Delegated Publishing

By default, this starter assumes repository collaborators follow the project's normal GitHub review and publishing process.

Teams that want content contributors to publish without approving application-code changes can add project-specific controls such as:

- GitHub teams for content publishers and web maintainers
- `CODEOWNERS` rules based on file paths
- Branch rules requiring pull requests and owner reviews
- Required content-validation checks
- A restricted Codex skill for content-authoring tasks

These controls are intentionally not included by default because repository ownership, approval requirements, and deployment permissions vary by organization. A Codex skill provides workflow guidance; GitHub permissions and branch rules should provide enforcement.

Always run `pnpm validate` and `pnpm content:history` before review.
