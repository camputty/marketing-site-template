import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export function renderMarkdown(markdown: string): string {
  const rendered = marked.parse(markdown, {
    async: false,
    gfm: true,
  }) as string;

  return sanitizeHtml(rendered, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "figure",
      "figcaption",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
      }),
    },
  });
}
