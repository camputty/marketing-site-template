import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";

describe("site configuration defaults", () => {
  it("keeps routing and lifecycle outside configuration", () => {
    expect(siteConfig.navigation).toEqual([]);
    expect("pages" in siteConfig).toBe(false);
    expect("status" in siteConfig).toBe(false);
    expect("initializedAt" in siteConfig).toBe(false);
  });
});
