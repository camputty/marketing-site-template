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

## Identity And URLs

- Never edit an ID after creation or reuse an ID from deleted content.
- Reference authors, topics, and products by ID.
- Keep IDs out of public URLs.
- When changing a published slug, add the old full path to `redirectFrom` before deploying.

## Media

Use immutable or versioned public R2 URLs. Store source, rights, attribution, and ownership notes in the project when relevant. Videos use a Cloudflare Stream ID; captions and transcripts remain stable public assets. Do not commit long-form source video to Git.

## Scheduled Content

A future `scheduled` entry remains private. It becomes public only when the date has arrived and an external action triggers a new deployment. Use Vercel Deploy Hooks, GitHub Actions, or another explicit scheduler when a project needs automatic publication.

Always run `pnpm validate` before review.
