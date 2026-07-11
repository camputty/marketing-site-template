import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const collectionRoots = [
  "/blog",
  "/case-studies",
  "/videos",
  "/guides",
  "/newsroom",
];
const maxRequestSamples = 200;
const maxBrowserPageSamples = 40;

function deterministicSample(values: Iterable<string>, limit: number): string[] {
  const sorted = [...new Set(values)].sort();
  if (sorted.length <= limit) return sorted;
  return Array.from({ length: limit }, (_, index) =>
    sorted[Math.floor((index * (sorted.length - 1)) / (limit - 1))],
  );
}

function representativeBrowserUrls(urls: Set<string>): string[] {
  const staticPages: string[] = [];
  const detailPages = new Map<string, string>();

  for (const url of [...urls].sort()) {
    const pathname = new URL(url).pathname;
    const detailRoot = collectionRoots.find((root) =>
      pathname.startsWith(`${root}/`),
    );
    if (detailRoot) {
      if (!detailPages.has(detailRoot)) detailPages.set(detailRoot, url);
      continue;
    }
    staticPages.push(url);
  }

  return [
    ...deterministicSample(staticPages, maxBrowserPageSamples),
    ...detailPages.values(),
  ].sort();
}

async function assertDiscoveryMetadata(
  page: Page,
  localUrl: string,
  canonicalOrigin: string,
) {
  await expect(page).toHaveTitle(/\S/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /\S/,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /\S/,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    /\S/,
  );
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveCount(1);
  const canonicalUrl = new URL((await canonical.getAttribute("href")) ?? "");
  expect(canonicalUrl.protocol).toBe("https:");
  expect(canonicalUrl.origin).toBe(canonicalOrigin);
  expect(`${canonicalUrl.pathname}${canonicalUrl.search}`).toBe(
    `${new URL(localUrl).pathname}${new URL(localUrl).search}`,
  );
}

test("public pages are accessible and their discoverable links resolve", async ({
  page,
  request,
}) => {
  test.setTimeout(180_000);
  const fixtureMediaHost = process.env.E2E_FIXTURE_MEDIA_HOST;
  let fixtureImageRequests = 0;
  let fixtureStreamRequests = 0;
  if (fixtureMediaHost) {
    await page.route(`https://${fixtureMediaHost}/**`, (route) => {
      fixtureImageRequests += 1;
      return route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="#ddd"/></svg>',
      });
    });
    await page.route(
      /https:\/\/customer-[a-z0-9-]+\.cloudflarestream\.com\/.*/,
      (route) => {
        fixtureStreamRequests += 1;
        return route.fulfill({
          contentType: "text/html",
          body: "<!doctype html><title>Stream fixture</title>",
        });
      },
    );
  }
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  expect(response?.headers()["x-powered-by"]).toBeUndefined();
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  await expect(page.locator("main")).toHaveCount(1);

  const isSetupPage = Boolean(
    await page.locator('[data-template-page="setup"]').count(),
  );
  if (isSetupPage) {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  } else if (process.env.E2E_PRODUCTION_SERVER) {
    const robotsMeta = page.locator('meta[name="robots"]');
    if (await robotsMeta.count()) {
      expect((await robotsMeta.getAttribute("content")) ?? "").not.toMatch(
        /noindex|nofollow/,
      );
    }
  }

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);

  const origin = new URL(page.url()).origin;
  const urls = new Set<string>([`${origin}/`]);
  const sitemapOrigins = new Set<string>();
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const xml = await sitemap.text();
  let sitemapEntryCount = 0;
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapEntryCount += 1;
    const canonicalUrl = new URL(match[1].replaceAll("&amp;", "&"));
    expect(canonicalUrl.protocol).toBe("https:");
    sitemapOrigins.add(canonicalUrl.origin);
    urls.add(
      new URL(
        `${canonicalUrl.pathname}${canonicalUrl.search}`,
        origin,
      ).toString(),
    );
  }
  if (!isSetupPage) expect(sitemapEntryCount).toBeGreaterThan(0);
  if (process.env.E2E_PRODUCTION_SERVER) {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBe(true);
    const robotsText = await robots.text();
    expect(robotsText).toMatch(/Allow:\s*\//);
    expect(robotsText).not.toMatch(/Disallow:\s*\//);
  }

  if (sitemapOrigins.size > 0) {
    expect(sitemapOrigins.size).toBe(1);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    expect(new URL((await canonical.getAttribute("href")) ?? "").origin).toBe(
      [...sitemapOrigins][0],
    );
    if (!isSetupPage) {
      await assertDiscoveryMetadata(page, `${origin}/`, [...sitemapOrigins][0]);
    }
  }

  const internalLinks = new Set<string>();
  const fragments = new Map<string, Set<string>>();
  const htmlUrls = new Set<string>([`${origin}/`]);
  for (const url of deterministicSample(urls, maxRequestSamples)) {
    const route = await request.get(url);
    expect(route.status(), url).toBeLessThan(400);
    if (!route.headers()["content-type"]?.includes("text/html")) continue;
    htmlUrls.add(url);
    const html = await route.text();
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      const href = match[1].replaceAll("&amp;", "&");
      if (href.startsWith("mailto:") || href.startsWith("tel:")) continue;
      const target = new URL(href, url);
      if (target.origin === origin) {
        const fragment = decodeURIComponent(target.hash.slice(1));
        target.hash = "";
        internalLinks.add(target.toString());
        if (fragment) {
          const targets = fragments.get(target.toString()) ?? new Set<string>();
          targets.add(fragment);
          fragments.set(target.toString(), targets);
        }
      }
    }
  }

  for (const url of deterministicSample(internalLinks, maxRequestSamples)) {
    const linkedRoute = await request.get(url);
    expect(linkedRoute.status(), url).toBeLessThan(400);
    const expectedFragments = fragments.get(url);
    if (linkedRoute.headers()["content-type"]?.includes("text/html")) {
      htmlUrls.add(url);
    }
    if (
      expectedFragments &&
      linkedRoute.headers()["content-type"]?.includes("text/html")
    ) {
      const html = await linkedRoute.text();
      for (const fragment of expectedFragments) {
        expect(
          html.includes(`id="${fragment}"`) || html.includes(`name="${fragment}"`),
          `${url}#${fragment}`,
        ).toBe(true);
      }
    }
  }

  const browserUrls = representativeBrowserUrls(htmlUrls);
  for (const url of browserUrls) {
    if (url === `${origin}/`) continue;
    consoleErrors.length = 0;
    pageErrors.length = 0;
    const pageResponse = await page.goto(url);
    expect(pageResponse?.status(), url).toBeLessThan(400);
    await expect(page.locator("main"), url).toHaveCount(1);
    const pageResults = await new AxeBuilder({ page }).analyze();
    expect(pageResults.violations, url).toEqual([]);
    if (!isSetupPage && urls.has(url) && sitemapOrigins.size === 1) {
      await assertDiscoveryMetadata(page, url, [...sitemapOrigins][0]);
    }
    if (fixtureMediaHost) {
      const images = page.locator("img");
      for (let index = 0; index < (await images.count()); index += 1) {
        const image = images.nth(index);
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate(
              (element) => {
                const imageElement = element as HTMLImageElement;
                return imageElement.complete && imageElement.naturalWidth > 0;
              },
            ),
          )
          .toBe(true);
      }
      const frames = page.locator('iframe[src*="cloudflarestream.com"]');
      for (let index = 0; index < (await frames.count()); index += 1) {
        await frames.nth(index).scrollIntoViewIfNeeded();
      }
    }
    expect(consoleErrors, url).toEqual([]);
    expect(pageErrors, url).toEqual([]);
  }
  if (fixtureMediaHost) {
    await expect.poll(() => fixtureImageRequests).toBeGreaterThan(0);
    await expect.poll(() => fixtureStreamRequests).toBeGreaterThan(0);
  }
});
