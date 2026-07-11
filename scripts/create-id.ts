import { ulid } from "ulid";

import {
  primaryCollectionContracts,
  supportingContentContracts,
} from "../src/lib/content/contracts";

const allowedPrefixes = new Set<string>([
  ...Object.values(primaryCollectionContracts).map(({ idPrefix }) => idPrefix),
  ...Object.values(supportingContentContracts).map(({ idPrefix }) => idPrefix),
]);
const prefix = process.argv[2];

if (!prefix || !allowedPrefixes.has(prefix)) {
  console.error("Usage: pnpm content:id <res|faq|aut|top|prd>");
  process.exit(1);
}

console.log(`${prefix}_${ulid()}`);
