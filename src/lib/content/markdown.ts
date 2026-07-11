import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const proseTags = [
  "p",
  "br",
  "strong",
  "em",
  "del",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "hr",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "caption",
  "sup",
  "sub",
] as const;

export function validateMarkdownStructure(markdown: string): string[] {
  const issues = new Set<string>();
  const tokens = marked.lexer(markdown, { gfm: true });

  marked.walkTokens(tokens, (token) => {
    if (token.type === "heading" && token.depth === 1) {
      issues.add("Body Markdown must start at heading level 2; the page title is the level 1 heading.");
    }
    if (token.type === "image") {
      issues.add("Inline Markdown images are not supported; use validated frontmatter media or an explicit React section.");
    }
    if (token.type === "link") {
      const scheme = token.href.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
      if (
        token.href.startsWith("//") ||
        (scheme && !["https", "mailto", "tel"].includes(scheme))
      ) {
        issues.add("Markdown links must be internal, relative, HTTPS, mailto, or tel URLs.");
      }
    }
    if (token.type === "html") {
      if (/<\s*h1\b/i.test(token.raw)) {
        issues.add("Body Markdown must not contain an HTML h1 element.");
      }
      if (/<\s*(?:img|picture|video|iframe)\b/i.test(token.raw)) {
        issues.add("Inline HTML media is not supported; use validated frontmatter media or an explicit React section.");
      }
      if (/<\s*a\b/i.test(token.raw)) {
        issues.add("Raw HTML links are not supported; use Markdown link syntax so destinations can be validated.");
      }
    }
  });

  return [...issues];
}

export function collectMarkdownLinks(markdown: string): string[] {
  const links: string[] = [];
  const tokens = marked.lexer(markdown, { gfm: true });
  marked.walkTokens(tokens, (token) => {
    if (token.type === "link") links.push(token.href);
  });
  return links;
}

export function renderMarkdown(markdown: string): string {
  const rendered = marked.parse(markdown, {
    async: false,
    gfm: true,
  }) as string;

  return sanitizeHtml(rendered, {
    allowedTags: [...proseTags],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      code: ["class"],
      th: ["align"],
      td: ["align"],
    },
    allowedSchemes: ["https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
      }),
    },
  });
}
