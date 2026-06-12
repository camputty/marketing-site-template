import { ulid } from "ulid";

const allowedPrefixes = new Set(["res", "faq", "aut", "top", "prd"]);
const prefix = process.argv[2];

if (!prefix || !allowedPrefixes.has(prefix)) {
  console.error("Usage: pnpm content:id <res|faq|aut|top|prd>");
  process.exit(1);
}

console.log(`${prefix}_${ulid()}`);
