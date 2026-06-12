import type { Metadata } from "next";

import {
  generateResourceMetadata,
  generateResourceStaticParams,
  ResourceDetailPage,
} from "@/components/resource-pages";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return generateResourceStaticParams("videos");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateResourceMetadata("videos", (await params).slug);
}

export default async function VideoDetailPage({ params }: PageProps) {
  return <ResourceDetailPage collection="videos" slug={(await params).slug} />;
}
