import fs from "node:fs";
import path from "node:path";

function isAddressableDirectory(name: string): boolean {
  return (
    !name.startsWith("_") &&
    !name.startsWith("@") &&
    !/^\(\.{1,3}\)/.test(name)
  );
}

function conventionFiles(directory: string, filename: string): string[] {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory() && isAddressableDirectory(entry.name)) {
      return conventionFiles(entryPath, filename);
    }
    return entry.isFile() && entry.name === filename ? [entryPath] : [];
  });
}

function filesMatching(
  directory: string,
  pattern: RegExp,
): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory() && isAddressableDirectory(entry.name)) {
      return filesMatching(entryPath, pattern);
    }
    return entry.isFile() && pattern.test(entry.name) ? [entryPath] : [];
  });
}

const metadataFilePattern = /^(?:favicon\.ico|(?:icon|apple-icon)\d?\.(?:ico|jpg|jpeg|png|svg|js|ts|tsx)|(?:opengraph-image|twitter-image)\d?\.(?:jpg|jpeg|png|gif|js|ts|tsx))$/;

function appRoute(appRoot: string, filePath: string): string {
  const directory = path.relative(appRoot, path.dirname(filePath));
  const segments = directory
    .split(path.sep)
    .filter((segment) => segment && !segment.startsWith("(") && !segment.startsWith("@"));

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function appMetadataRoute(appRoot: string, filePath: string): string {
  const directoryRoute = appRoute(appRoot, filePath);
  const extension = path.extname(filePath).slice(1);
  const filename = ["js", "ts", "tsx"].includes(extension)
    ? path.basename(filePath, path.extname(filePath))
    : path.basename(filePath);
  return `${directoryRoute === "/" ? "" : directoryRoute}/${filename}`;
}

export function collectAppPageRoutes(root = process.cwd()): string[] {
  const appRoot = path.join(root, "src", "app");
  return [
    ...new Set(
      conventionFiles(appRoot, "page.tsx").map((filePath) =>
        appRoute(appRoot, filePath),
      ),
    ),
  ].sort();
}

export function collectStaticPageRoutes(root = process.cwd()): string[] {
  return collectAppPageRoutes(root).filter((route) => !route.includes("["));
}

export function collectStaticRouteHandlerRoutes(
  root = process.cwd(),
): string[] {
  const appRoot = path.join(root, "src", "app");
  return [
    ...new Set(
      conventionFiles(appRoot, "route.ts")
        .map((filePath) => appRoute(appRoot, filePath))
        .filter((route) => !route.includes("[")),
    ),
  ].sort();
}

export function collectPublicFileRoutes(root = process.cwd()): string[] {
  const publicRoot = path.join(root, "public");
  if (!fs.existsSync(publicRoot)) return [];

  function publicFiles(directory: string): string[] {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return publicFiles(entryPath);
      return entry.isFile()
        ? [`/${path.relative(publicRoot, entryPath).split(path.sep).join("/")}`]
        : [];
    });
  }

  return publicFiles(publicRoot).sort();
}

export function collectProtectedRedirectPaths(
  root = process.cwd(),
): string[] {
  const appRoot = path.join(root, "src", "app");
  const metadataRoutes = [
    ["robots.ts", "/robots.txt"],
    ["sitemap.ts", "/sitemap.xml"],
    ["manifest.ts", "/manifest.webmanifest"],
  ] as const;

  return [
    ...new Set([
      ...collectStaticPageRoutes(root),
      ...collectStaticRouteHandlerRoutes(root),
      ...collectPublicFileRoutes(root),
      ...filesMatching(appRoot, metadataFilePattern).map((filePath) =>
        appMetadataRoute(appRoot, filePath),
      ),
      ...metadataRoutes.flatMap(([filename, route]) =>
        fs.existsSync(path.join(appRoot, filename)) ? [route] : [],
      ),
    ]),
  ].sort();
}

export function matchesAppPageRoute(pathname: string, route: string): boolean {
  const pathSegments = pathname.split("/").filter(Boolean);
  const routeSegments = route.split("/").filter(Boolean);

  for (let index = 0; index < routeSegments.length; index += 1) {
    const segment = routeSegments[index];
    if (segment.startsWith("[[...") || segment.startsWith("[...")) {
      return segment.startsWith("[[...") || pathSegments.length > index;
    }
    if (pathSegments[index] === undefined) return false;
    if (!segment.startsWith("[") && segment !== pathSegments[index]) return false;
  }

  return pathSegments.length === routeSegments.length;
}
