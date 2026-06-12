import type { Metadata } from "next";

import {
  generateResourceMetadata,
  generateResourceStaticParams,
  ResourceDetailPage,
} from "@/components/resource-pages";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return generateResourceStaticParams("blog");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateResourceMetadata("blog", (await params).slug);
}

export default async function BlogDetailPage({ params }: PageProps) {
  return <ResourceDetailPage collection="blog" slug={(await params).slug} />;
}
