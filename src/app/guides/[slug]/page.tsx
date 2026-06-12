import type { Metadata } from "next";

import {
  generateResourceMetadata,
  generateResourceStaticParams,
  ResourceDetailPage,
} from "@/components/resource-pages";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return generateResourceStaticParams("guides");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateResourceMetadata("guides", (await params).slug);
}

export default async function GuideDetailPage({ params }: PageProps) {
  return <ResourceDetailPage collection="guides" slug={(await params).slug} />;
}
