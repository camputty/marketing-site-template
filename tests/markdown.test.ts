import { describe, expect, it } from "vitest";

import {
  collectMarkdownLinks,
  renderMarkdown,
  validateMarkdownStructure,
} from "@/lib/content/markdown";

describe("Markdown boundaries", () => {
  it("sanitizes scripts, handlers, unsafe schemes, and protocol-relative links", () => {
    const html = renderMarkdown(
      '<script>alert(1)</script><a href="//tracker.test" onclick="alert(1)">Tracker</a> [Unsafe](javascript:alert(1))',
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("//tracker.test");
    expect(html).not.toContain('href="javascript:');
  });

  it("rejects duplicate page headings and inline media", () => {
    expect(validateMarkdownStructure("# Another title\n\n![Alt](https://media.test/a.jpg)"))
      .toEqual([
        "Body Markdown must start at heading level 2; the page title is the level 1 heading.",
        "Inline Markdown images are not supported; use validated frontmatter media or an explicit React section.",
      ]);
    expect(
      validateMarkdownStructure('<img src="https://media.test/a.jpg" alt="Alt">'),
    ).toContain(
      "Inline HTML media is not supported; use validated frontmatter media or an explicit React section.",
    );
    expect(validateMarkdownStructure("[Insecure](http://example.test)"))
      .toContain(
        "Markdown links must be internal, relative, HTTPS, mailto, or tel URLs.",
      );
    expect(validateMarkdownStructure('<a href="/missing">Missing</a>')).toContain(
      "Raw HTML links are not supported; use Markdown link syntax so destinations can be validated.",
    );
  });

  it("collects links for production route validation", () => {
    expect(
      collectMarkdownLinks("[Internal](/about) and [relative](../guide)"),
    ).toEqual(["/about", "../guide"]);
  });
});
