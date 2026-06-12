import { describe, expect, it } from "vitest";

import { escapeXml } from "@/lib/xml";

describe("escapeXml", () => {
  it("escapes XML-sensitive characters", () => {
    expect(escapeXml(`A & B <C> "D"`)).toBe(
      "A &amp; B &lt;C&gt; &quot;D&quot;",
    );
  });
});
