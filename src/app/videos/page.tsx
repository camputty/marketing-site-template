import {
  generateResourceIndexMetadata,
  ResourceIndexPage,
} from "@/components/resource-pages";

export const metadata = generateResourceIndexMetadata("videos");

export default function VideosPage() {
  return <ResourceIndexPage collection="videos" />;
}
