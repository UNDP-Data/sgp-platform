const EXACT_REDIRECTS: Readonly<Record<string, string>> = {
  "/funding/opportunities": "/funding",
  "/funding/how-it-works": "/help/applicants",
  "/funding/eligibility": "/help/applicants",
  "/funding/resources": "/help/templates",
  "/portfolio/dashboard": "/portfolio",
  "/portfolio/projects": "/portfolio",
  "/portfolio/countries": "/portfolio",
  "/portfolio/themes": "/portfolio",
  "/knowledge/projects": "/knowledge/library?scope=projects",
  "/knowledge/search": "/knowledge/library",
  "/knowledge/templates": "/help/templates",
  "/stories/voices": "/stories#sgp-voices",
  "/community/events": "/community",
  "/community/exchange": "/community",
  "/community/contribute": "/community",
  "/help/getting-started": "/help",
  "/help/reviewers": "/workspace/support",
  "/help/support": "/help/contact",
  "/help/accessibility-language": "/help/contact",
  "/workspace/contributions": "/workspace",
  "/workspace/applications": "/workspace/proposals",
  "/workspace/visits": "/workspace/monitoring",
  "/workspace/reports": "/workspace/results",
  "/workspace/notifications": "/workspace",
  "/workspace/assistant-history": "/workspace/saved?tab=ai-history",
  "/workspace/ai-chat-history": "/workspace/saved?tab=ai-history",
  "/api": "/admin/integrations",
  "/admin/shared": "/admin",
  "/admin/undp": "/admin",
  "/admin/agency-integrations": "/admin/integrations",
  "/super-admin": "/platform-admin",
  "/it-admin/health": "/it-admin/frontend",
  "/it-admin/environments": "/it-admin/frontend/environments",
  "/it-admin/incidents": "/it-admin/frontend/incidents",
  "/it-admin/jobs": "/it-admin/frontend/jobs",
  "/it-admin/integrations": "/it-admin/frontend/integrations",
  "/it-admin/logs": "/it-admin/frontend/logs",
  "/it-admin/security": "/it-admin/frontend/security"
};

function finalSegment(path: string) {
  const value = path.split("/").at(-1) || "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function withQuery(destination: string, key: string, sourcePath: string) {
  return `${destination}?${key}=${encodeURIComponent(finalSegment(sourcePath))}`;
}

export function legacyDestination(path: string) {
  if (EXACT_REDIRECTS[path]) return EXACT_REDIRECTS[path];
  if (path.startsWith("/funding/opportunities/")) return "/funding";
  if (path.startsWith("/portfolio/projects/")) return withQuery("/portfolio", "q", path);
  if (path.startsWith("/portfolio/countries/")) return withQuery("/portfolio", "countries", path);
  if (path.startsWith("/portfolio/themes/")) return withQuery("/portfolio", "focalAreas", path);
  if (path.startsWith("/stories/themes/")) return withQuery("/stories", "theme", path);
  if (path.startsWith("/stories/places/")) return withQuery("/stories", "place", path);
  if (path.startsWith("/workspace/applications/")) return `/workspace/proposals/${encodeURIComponent(finalSegment(path))}`;
  if (path.startsWith("/workspace/visits/")) return `/workspace/monitoring/${encodeURIComponent(finalSegment(path))}`;
  if (path.startsWith("/workspace/reports/")) return `/workspace/results/${encodeURIComponent(finalSegment(path))}`;
  if (path.startsWith("/admin/shared/knowledge") || path.startsWith("/admin/shared/taxonomy") || path.startsWith("/admin/shared/publication")) return "/admin/documents";
  if (path.startsWith("/admin/shared/portfolio") || path.startsWith("/admin/shared/opportunities")) return "/admin/data";
  if (path.startsWith("/admin/shared/content")) return "/admin/site-content";
  if (path.startsWith("/admin/shared/ai")) return "/admin/ai";
  if (path.startsWith("/admin/shared/integrations") || path.startsWith("/admin/agency-integrations")) return "/admin/integrations";
  if (path.startsWith("/admin/shared/access-audit")) return "/admin/users";
  if (path.startsWith("/admin/shared/operations")) return "/admin";
  if (path.startsWith("/admin/undp/")) return `/admin/${encodeURIComponent(finalSegment(path))}`;
  if (path.startsWith("/super-admin/")) return `/platform-admin/${encodeURIComponent(finalSegment(path))}`;
  return null;
}

export function preserveLocation(destination: string, search: string, hash: string) {
  const hashIndex = destination.indexOf("#");
  const destinationPath = hashIndex >= 0 ? destination.slice(0, hashIndex) : destination;
  const destinationHash = hashIndex >= 0 ? destination.slice(hashIndex) : "";
  const preservedSearch = destinationPath.includes("?") ? "" : search;
  return `${destinationPath}${preservedSearch}${destinationHash || hash}`;
}
