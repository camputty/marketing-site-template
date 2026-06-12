import { describe, expect, it } from "vitest";

import { siteConfig, siteConfigSchema } from "@/config/site";

describe("site configuration defaults", () => {
  it("keeps routing and lifecycle outside configuration", () => {
    expect(siteConfig.navigation).toEqual([]);
    expect("pages" in siteConfig).toBe(false);
    expect("status" in siteConfig).toBe(false);
    expect("initializedAt" in siteConfig).toBe(false);
  });

  it("requires usable navigation destinations", () => {
    expect(
      siteConfigSchema.safeParse({
        ...siteConfig,
        navigation: [{ label: "Empty", href: "" }],
      }).success,
    ).toBe(false);
    expect(
      siteConfigSchema.safeParse({
        ...siteConfig,
        navigation: [{ label: "Protocol relative", href: "//example.org" }],
      }).success,
    ).toBe(false);
  });
});
