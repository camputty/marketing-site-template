import type { Metadata } from "next";

import {
  generateResourceMetadata,
  generateResourceStaticParams,
  ResourceDetailPage,
} from "@/components/resource-pages";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return generateResourceStaticParams("newsroom");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateResourceMetadata("newsroom", (await params).slug);
}

export default async function NewsroomDetailPage({ params }: PageProps) {
  return <ResourceDetailPage collection="newsroom" slug={(await params).slug} />;
}
