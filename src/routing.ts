export type RouteDefinition = { path: string };

export function routePatternMatches(pattern: string, path: string) {
  if (pattern === "*") return true;
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = `^${escaped.replace(/:[^/]+/g, "[^/]+")}$`;
  return new RegExp(expression).test(path);
}

export function findRoute<T extends RouteDefinition>(routes: T[], path: string) {
  return routes.find((route) => route.path !== "*" && routePatternMatches(route.path, path))
    ?? routes.find((route) => route.path === "*");
}
