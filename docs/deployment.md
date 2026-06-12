# Deployment

## Vercel

Import the GitHub repository into Vercel. `vercel.json` runs `pnpm build:vercel`:

- Preview builds validate and build even while company configuration is incomplete.
- Production builds additionally enforce `pnpm readiness`.
- Local production checks use `pnpm build:production`.

Do not bypass the production command. Fix placeholder configuration, template markers, invalid content, and missing published-video settings before launch.

## Cloudflare R2

Create an R2 bucket outside this repository and expose published assets through a stable owned hostname such as `media.example.com`. Use immutable paths and least-privilege upload credentials. The website reads public asset URLs and does not need R2 credentials to render.

The production gate requires a non-template media hostname only when the site has publishable resources. A page-only launch does not need Cloudflare media configuration.

## Cloudflare Stream

Upload video through Cloudflare’s dashboard or project-specific automation. Set `NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE` in Vercel so published Stream IDs can render. Keep account credentials server-only and outside Git.

## Environment Variables

Copy the names from `.env.example` into local and Vercel environments. Never commit values. The baseline does not consume account credentials because it does not provision or upload media.

## Search Operations

The site emits canonical metadata, JSON-LD, a standard sitemap, a video sitemap when applicable, RSS, and robots rules. Verify current crawler guidance from official provider documentation immediately before launch. Add IndexNow submission only when the project has a key and deployment workflow; the starter merely reserves the environment variable.

Git-backed text history does not back up Cloudflare media. Define a separate media backup and retention policy for each company.
