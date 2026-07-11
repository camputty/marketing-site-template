export const templatePlaceholders = {
  summary: "Replace with a concise summary.",
  body: "Replace with substantive content.",
  faqBody: "Replace with the answer.",
  customerName: "Replace with customer name",
  challenge: "Replace with the challenge.",
  solution: "Replace with the solution.",
  results: "Replace with the results.",
  streamId: "replace-stream-id",
} as const;

const normalizedPlaceholders = new Set(
  Object.values(templatePlaceholders).map((value) => value.trim().toLowerCase()),
);

export function findTemplatePlaceholderPaths(
  value: unknown,
  path: string[] = [],
): string[] {
  if (typeof value === "string") {
    return normalizedPlaceholders.has(value.trim().toLowerCase())
      ? [path.join(".") || "value"]
      : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      findTemplatePlaceholderPaths(entry, [...path, String(index)]),
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) =>
      findTemplatePlaceholderPaths(entry, [...path, key]),
    );
  }

  return [];
}
