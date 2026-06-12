export function cloudflareStreamPlayerUrl(
  videoId: string,
  customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE,
): string | undefined {
  if (!customerCode) return undefined;

  return `https://customer-${customerCode}.cloudflarestream.com/${encodeURIComponent(videoId)}/iframe`;
}
