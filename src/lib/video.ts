export function isCloudflareStreamCustomerCode(
  value: string | undefined,
): value is string {
  if (!value || value !== value.trim() || value.length > 54) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(value);
}

export function cloudflareStreamPlayerUrl(
  videoId: string,
  customerCode = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE,
): string | undefined {
  if (!isCloudflareStreamCustomerCode(customerCode)) return undefined;

  return `https://customer-${customerCode}.cloudflarestream.com/${encodeURIComponent(videoId)}/iframe`;
}
