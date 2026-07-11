import {
  generateResourceIndexMetadata,
  ResourceIndexPage,
} from "@/components/resource-pages";

export const metadata = generateResourceIndexMetadata("caseStudies");

export default function CaseStudiesPage() {
  return <ResourceIndexPage collection="caseStudies" />;
}
