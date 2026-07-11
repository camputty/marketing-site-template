# Deployment

## Vercel

Import the GitHub repository into Vercel. `vercel.json` runs `pnpm build:vercel`:

- Preview builds validate and build even while company configuration is incomplete.
- Production builds additionally enforce `pnpm readiness`.
- Clean production checkouts compare content identity with the previous commit when Git history is available; pull-request CI compares with the branch base.
- Local production checks use `pnpm build:production`.

Vercel preview and development deployments emit `noindex` metadata, disallow crawling in `robots.txt`, and omit discovery feeds. Only a configured production deployment is indexable.

Do not bypass the production command. Fix placeholder configuration, template markers, invalid content, and missing publishable-video settings before launch.

## Cloudflare R2

Create an R2 bucket outside this repository and expose published assets through a stable owned hostname such as `media.example.com`. Use immutable paths and least-privilege upload credentials. The website reads public asset URLs and does not need R2 credentials to render.

The production gate requires a non-template media hostname only when the site has publishable resources. A page-only launch does not need Cloudflare media configuration.

## Cloudflare Stream

Upload video through Cloudflare’s dashboard or project-specific automation. Set `NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE` in Vercel so published Stream IDs can render. Keep account credentials server-only and outside Git.

The baseline treats `access: gated` as metadata and blocks it at production readiness. Implement signed Stream URLs and real download fulfillment before claiming that media is gated.

## Environment Variables

Copy the Stream customer-code variable from `.env.example` only when the project publishes video. Never commit values. The baseline does not consume account credentials because it does not provision or upload media.

## Security And Maintenance

The application disables the framework signature and sends a narrow baseline policy for framing, object embedding, referrers, browser capabilities, and content sniffing. Adjust the policy deliberately when a real integration requires more access. Monthly grouped Dependabot updates keep runtime packages and GitHub Actions visible for reviewed maintenance.

## Search Operations

The site emits canonical metadata, JSON-LD, a standard sitemap, a video sitemap when applicable, RSS, and robots rules. Verify current crawler guidance from official provider documentation immediately before launch. Add IndexNow only with a real key and submission workflow for the individual site.

Git-backed text history does not back up Cloudflare media. Define a separate media backup and retention policy for each company.
