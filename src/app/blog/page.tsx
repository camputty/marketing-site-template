import {
  generateResourceIndexMetadata,
  ResourceIndexPage,
} from "@/components/resource-pages";

export const metadata = generateResourceIndexMetadata("blog");

export default function BlogPage() {
  return <ResourceIndexPage collection="blog" />;
}
