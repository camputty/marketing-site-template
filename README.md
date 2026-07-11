# Agent-Native Marketing Site Starter

A brand-neutral GitHub Template for bespoke marketing sites built and maintained primarily through code and AI agents. It standardizes durable publishing contracts and launch guardrails without prescribing a company’s pages, copy, visual identity, or design system.

## Included

- Next.js App Router, TypeScript, and Tailwind CSS
- Repository-backed Markdown with Zod validation
- Blog, case study, video, guide, newsroom, FAQ, author, topic, and product contracts
- Immutable internal IDs and permanent slug redirects
- Git-history checks for ID and published-slug changes
- Draft, scheduled, published, and archived states
- Canonical metadata, JSON-LD, sitemaps, video sitemap, RSS, and robots rules
- Cloudflare R2 and Stream data contracts
- Vercel previews and a production readiness gate
- Unit, content-integrity, and browser accessibility checks

It intentionally excludes a CMS, database, admin dashboard, forms, CRM behavior, authentication, external search, page builder, and infrastructure provisioning.

## Start A Site

1. Create a repository from this GitHub Template.
2. Install the Active LTS Node.js release pinned in `.nvmrc` and enable Corepack:

   ```bash
   corepack enable
   pnpm install --frozen-lockfile
   ```

3. Optionally use `docs/site-brief.md` as an onboarding worksheet.
4. Configure `src/config/site.json` with the company identity, navigation, resources, SEO defaults, language, and media hostname.
5. Build the company’s routes and design directly in `src/app` and `src/components`.
6. Add resources with `pnpm content:new blog "Article title"` and validate with `pnpm validate`.
7. Add the brand icon and social preview, replace the template homepage, satisfy `pnpm readiness`, and run `pnpm build:production`.

The untouched starter runs locally as a `noindex` setup page. Vercel preview builds are allowed; Vercel production builds fail until readiness checks pass.

The commands below use `pnpm` for readability. Prefix them with `corepack` on systems where a global pnpm shim is unavailable.

## Work With An AI Agent

Open the new repository in Codex, Claude Code, or another coding agent; provide the company brief and approved source material; and ask it to build the required pages directly in `src/app` and `src/components`. `AGENTS.md` is the canonical architecture, publishing, and completion contract. `CLAUDE.md` points Claude-based tools to the same source so instructions do not drift.

Enable only the resource collections the project needs. Pages and collections may be added, adapted, or removed as the company requires; no page inventory or generic section configuration is required before work begins.

See [agent workflows](docs/agent-workflows.md) for repeatable page, publishing, slug, media, integration, and verification tasks.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start local development |
| `pnpm content:new <type> "Title"` | Create a draft Markdown entry with an immutable ID |
| `pnpm content:id <prefix>` | Generate an ID without creating a file |
| `pnpm validate` | Validate all content and relationships |
| `pnpm content:history` | Protect IDs and published paths against the Git base |
| `pnpm readiness` | Explain what blocks production |
| `pnpm check` | Run lint, types, unit tests, validation, and build |
| `pnpm test:e2e` | Run the browser accessibility smoke test |
| `pnpm test:configured` | Build and browser-test an isolated fully configured fixture |

See [architecture](docs/architecture.md), [content authoring](docs/content-authoring.md), [deployment](docs/deployment.md), and the [launch checklist](docs/launch-checklist.md).

## License

Released under the [MIT License](LICENSE).
