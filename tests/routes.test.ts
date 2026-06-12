import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  collectAppPageRoutes,
  collectStaticPageRoutes,
  matchesAppPageRoute,
} from "@/lib/routes";

describe("app routes", () => {
  it("discovers explicit pages, strips route groups, and separates dynamic routes", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "marketing-routes-"));
    for (const file of [
      "src/app/page.tsx",
      "src/app/(marketing)/about/page.tsx",
      "src/app/blog/page.tsx",
      "src/app/blog/[slug]/page.tsx",
    ]) {
      const target = path.join(root, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, "export default function Page() { return null; }");
    }

    try {
      expect(collectAppPageRoutes(root)).toEqual([
        "/",
        "/about",
        "/blog",
        "/blog/[slug]",
      ]);
      expect(collectStaticPageRoutes(root)).toEqual(["/", "/about", "/blog"]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("matches static and dynamic page routes", () => {
    expect(matchesAppPageRoute("/about", "/about")).toBe(true);
    expect(matchesAppPageRoute("/blog/example", "/blog/[slug]")).toBe(true);
    expect(matchesAppPageRoute("/blog", "/blog/[slug]")).toBe(false);
  });
});
