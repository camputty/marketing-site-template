import {
  primaryCollectionContracts,
  primaryCollectionKeys,
} from "./contracts";

export type ContentHistoryEntry = {
  sourcePath: string;
  collection: string;
  id: string;
  slug?: string;
  status?: string;
  publishedAt?: string;
  redirectFrom: string[];
};

const publicRoutes: Record<string, string> = Object.fromEntries(
  primaryCollectionKeys.map((key) => {
    const contract = primaryCollectionContracts[key];
    return [contract.directory, contract.route];
  }),
);

function resourceUrl(entry: ContentHistoryEntry): string | undefined {
  const route = publicRoutes[entry.collection];
  return route && entry.slug ? `${route}/${entry.slug}` : undefined;
}

export function compareContentHistory(
  previous: ContentHistoryEntry[],
  current: ContentHistoryEntry[],
): string[] {
  const issues: string[] = [];
  const previousByPath = new Map(previous.map((entry) => [entry.sourcePath, entry]));
  const currentById = new Map(current.map((entry) => [entry.id, entry]));

  for (const entry of current) {
    const oldAtPath = previousByPath.get(entry.sourcePath);
    if (oldAtPath && oldAtPath.id !== entry.id) {
      issues.push(
        `${entry.sourcePath}: content ID changed from ${oldAtPath.id} to ${entry.id}; IDs are immutable`,
      );
    }
  }

  for (const oldEntry of previous) {
    const newEntry = currentById.get(oldEntry.id);
    if (!newEntry) {
      issues.push(
        `${oldEntry.sourcePath}: content ID ${oldEntry.id} was removed; keep the record and set status to archived so permanent IDs cannot be replaced or recycled`,
      );
      continue;
    }
    if (newEntry.collection !== oldEntry.collection) {
      issues.push(
        `${newEntry.sourcePath}: ${oldEntry.id} moved from ${oldEntry.collection} to ${newEntry.collection}; create a new resource ID when changing content type`,
      );
      continue;
    }

    if (
      oldEntry.collection === "faqs" &&
      oldEntry.slug !== newEntry.slug
    ) {
      issues.push(
        `${newEntry.sourcePath}: committed FAQ slug ${oldEntry.slug} is immutable because it may be a public fragment identifier`,
      );
      continue;
    }

    const oldUrl = resourceUrl(oldEntry);
    if (oldUrl) {
      for (const redirect of oldEntry.redirectFrom) {
        if (!newEntry.redirectFrom.includes(redirect)) {
          issues.push(
            `${newEntry.sourcePath}: keep prior redirectFrom path ${redirect}; redirect history is permanent`,
          );
        }
      }
    }
    if (
      oldUrl &&
      oldEntry.slug !== newEntry.slug &&
      !newEntry.redirectFrom.includes(oldUrl)
    ) {
      issues.push(
        `${newEntry.sourcePath}: committed resource slug changed; add ${oldUrl} to redirectFrom`,
      );
    }
  }

  return issues;
}
