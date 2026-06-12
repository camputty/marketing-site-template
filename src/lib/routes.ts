import fs from "node:fs";
import path from "node:path";

function pageFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return pageFiles(entryPath);
    return entry.isFile() && entry.name === "page.tsx" ? [entryPath] : [];
  });
}

function pageRoute(appRoot: string, filePath: string): string {
  const directory = path.relative(appRoot, path.dirname(filePath));
  const segments = directory
    .split(path.sep)
    .filter((segment) => segment && !segment.startsWith("(") && !segment.startsWith("@"));

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

export function collectAppPageRoutes(root = process.cwd()): string[] {
  const appRoot = path.join(root, "src", "app");
  return [...new Set(pageFiles(appRoot).map((filePath) => pageRoute(appRoot, filePath)))].sort();
}

export function collectStaticPageRoutes(root = process.cwd()): string[] {
  return collectAppPageRoutes(root).filter((route) => !route.includes("["));
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
