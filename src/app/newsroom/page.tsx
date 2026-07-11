import {
  generateResourceIndexMetadata,
  ResourceIndexPage,
} from "@/components/resource-pages";

export const metadata = generateResourceIndexMetadata("newsroom");

export default function NewsroomPage() {
  return <ResourceIndexPage collection="newsroom" />;
}
