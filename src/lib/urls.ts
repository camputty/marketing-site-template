const internalOrigin = "https://internal.invalid";

function parsedUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

export function isHttpsUrl(value: string): boolean {
  const url = parsedUrl(value);
  return Boolean(
    value.startsWith("https://") &&
      url &&
      url.protocol === "https:" &&
      !url.username &&
      !url.password,
  );
}

export function isHttpsAssetUrl(value: string): boolean {
  const url = parsedUrl(value);
  return Boolean(
    isHttpsUrl(value) &&
      url &&
      !value.includes("#") &&
      !value.includes("?") &&
      !url.hash &&
      !url.search &&
      !url.port,
  );
}

export function isCanonicalUrl(value: string): boolean {
  const url = parsedUrl(value);
  return Boolean(
    isHttpsUrl(value) &&
      url &&
      !value.includes("#") &&
      !url.hash &&
      !url.port,
  );
}

export function isSiteBaseUrl(value: string): boolean {
  const url = parsedUrl(value);
  return Boolean(
    isHttpsUrl(value) &&
      url &&
      url.pathname === "/" &&
      !url.port &&
      !/[?#]/.test(value) &&
      !url.search &&
      !url.hash,
  );
}

export function isInternalHref(value: string): boolean {
  if (/^#[^\s#]+$/.test(value)) return true;
  if (!/^\/(?!\/)/.test(value)) return false;

  try {
    const url = new URL(value, internalOrigin);
    return (
      url.origin === internalOrigin &&
      `${url.pathname}${url.search}${url.hash}` === value
    );
  } catch {
    return false;
  }
}

export function isInternalPathHref(value: string): boolean {
  return value.startsWith("/") && isInternalHref(value);
}

export function isNavigationHref(value: string): boolean {
  if (isInternalHref(value)) return true;
  const url = parsedUrl(value);
  return Boolean(
    url &&
      !url.username &&
      !url.password &&
      ["https:", "mailto:", "tel:"].includes(url.protocol),
  );
}

export function isLiteralRedirectPath(value: string): boolean {
  if (!isInternalPathHref(value)) return false;
  if (value === "/" || value.endsWith("/")) return false;
  if (/[\[\]{}():*+?]/.test(value)) return false;

  const url = new URL(value, internalOrigin);
  if (url.search || url.hash) return false;
  return !["/_next", "/api"].some(
    (prefix) => value === prefix || value.startsWith(`${prefix}/`),
  );
}
