import { describe, expect, it } from "vitest";

import {
  compareContentHistory,
  type ContentHistoryEntry,
} from "@/lib/content/history";

const published: ContentHistoryEntry = {
  sourcePath: "content/blog/example.md",
  collection: "blog",
  id: "res_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  slug: "example",
  status: "published",
  publishedAt: "2026-06-01",
  redirectFrom: [],
};

describe("content history", () => {
  it("rejects an ID edit at an existing source path", () => {
    expect(
      compareContentHistory(
        [published],
        [{ ...published, id: "res_01ARZ3NDEKTSV4RRFFQ69G5FAX" }],
      ),
    ).toContain(
      "content/blog/example.md: content ID changed from res_01ARZ3NDEKTSV4RRFFQ69G5FAV to res_01ARZ3NDEKTSV4RRFFQ69G5FAX; IDs are immutable",
    );
  });

  it("rejects removing a permanent record", () => {
    expect(compareContentHistory([published], [])).toEqual([
      "content/blog/example.md: content ID res_01ARZ3NDEKTSV4RRFFQ69G5FAV was removed; keep the record and set status to archived so permanent IDs cannot be replaced or recycled",
    ]);
  });

  it("rejects replacing both the path and ID while allowing a move with the same ID", () => {
    const moved = {
      ...published,
      sourcePath: "content/blog/renamed-file.md",
    };

    expect(compareContentHistory([published], [moved])).toEqual([]);
    expect(
      compareContentHistory(
        [published],
        [{ ...moved, id: "res_01ARZ3NDEKTSV4RRFFQ69G5FAX" }],
      ),
    ).toEqual([
      "content/blog/example.md: content ID res_01ARZ3NDEKTSV4RRFFQ69G5FAV was removed; keep the record and set status to archived so permanent IDs cannot be replaced or recycled",
    ]);
  });

  it("requires the previous public path after a slug change", () => {
    expect(
      compareContentHistory(
        [published],
        [{ ...published, slug: "renamed", redirectFrom: [] }],
      ),
    ).toEqual([
      "content/blog/example.md: committed resource slug changed; add /blog/example to redirectFrom",
    ]);
    expect(
      compareContentHistory(
        [published],
        [
          {
            ...published,
            slug: "renamed",
            redirectFrom: ["/blog/example"],
          },
        ],
      ),
    ).toEqual([]);
  });

  it("keeps a published FAQ fragment slug immutable", () => {
    const faq: ContentHistoryEntry = {
      ...published,
      sourcePath: "content/faqs/example.md",
      collection: "faqs",
      id: "faq_01ARZ3NDEKTSV4RRFFQ69G5FAV",
    };

    expect(
      compareContentHistory(
        [faq],
        [{ ...faq, slug: "renamed" }],
      ),
    ).toEqual([
      "content/faqs/example.md: committed FAQ slug example is immutable because it may be a public fragment identifier",
    ]);
  });

  it("preserves a resource path even after an intermediate archive", () => {
    const archived = { ...published, status: "archived" };

    expect(
      compareContentHistory(
        [archived],
        [{ ...archived, slug: "renamed", status: "published" }],
      ),
    ).toEqual([
      "content/blog/example.md: committed resource slug changed; add /blog/example to redirectFrom",
    ]);
  });

  it("keeps every redirect across multiple slug changes", () => {
    const secondSlug = {
      ...published,
      slug: "second",
      redirectFrom: ["/blog/example"],
    };

    expect(
      compareContentHistory(
        [secondSlug],
        [
          {
            ...secondSlug,
            slug: "third",
            redirectFrom: ["/blog/second"],
          },
        ],
      ),
    ).toEqual([
      "content/blog/example.md: keep prior redirectFrom path /blog/example; redirect history is permanent",
    ]);
  });
});
