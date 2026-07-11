import { describe, expect, it } from "vitest";

import {
  cloudflareStreamPlayerUrl,
  isCloudflareStreamCustomerCode,
} from "@/lib/video";

describe("Cloudflare Stream customer codes", () => {
  it("accepts DNS-label-safe codes and builds the player URL", () => {
    expect(isCloudflareStreamCustomerCode("abc123-example")).toBe(true);
    expect(cloudflareStreamPlayerUrl("video/id", "abc123-example")).toBe(
      "https://customer-abc123-example.cloudflarestream.com/video%2Fid/iframe",
    );
  });

  it("rejects whitespace, hostname punctuation, and oversized values", () => {
    expect(isCloudflareStreamCustomerCode(" abc123 ")).toBe(false);
    expect(isCloudflareStreamCustomerCode("abc.example")).toBe(false);
    expect(isCloudflareStreamCustomerCode("a".repeat(55))).toBe(false);
    expect(cloudflareStreamPlayerUrl("video", "bad value")).toBeUndefined();
  });
});
