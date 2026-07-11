import {
  generateResourceIndexMetadata,
  ResourceIndexPage,
} from "@/components/resource-pages";

export const metadata = generateResourceIndexMetadata("guides");

export default function GuidesPage() {
  return <ResourceIndexPage collection="guides" />;
}
