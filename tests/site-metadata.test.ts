import { describe, expect, it } from "vitest";

import {
  baseMetadata,
  isDiscoveryEnabled,
  isIndexingEnabled,
} from "@/lib/site";
import { securityHeaders } from "../next.config";

describe("deployment metadata", () => {
  it("keeps Vercel previews out of search even after configuration", () => {
    expect(isIndexingEnabled("preview", true, "production")).toBe(false);
    expect(isIndexingEnabled("development", true, "production")).toBe(false);
    expect(isIndexingEnabled("production", true, "production")).toBe(true);
    expect(isIndexingEnabled(undefined, true, "development")).toBe(false);
    expect(isIndexingEnabled(undefined, false, "production")).toBe(false);
    expect(isDiscoveryEnabled("preview", true)).toBe(false);
    expect(isDiscoveryEnabled(undefined, true)).toBe(true);
  });

  it("keeps the untouched template noindex", () => {
    expect(baseMetadata().robots).toMatchObject({ index: false, follow: false });
  });

  it("ships a narrow baseline of security headers", () => {
    expect(Object.fromEntries(securityHeaders.map(({ key, value }) => [key, value])))
      .toMatchObject({
        "Content-Security-Policy": expect.stringContaining("frame-ancestors 'none'"),
        "Permissions-Policy": expect.stringContaining("camera=()"),
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      });
  });
});
