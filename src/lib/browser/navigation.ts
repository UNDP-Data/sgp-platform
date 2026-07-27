export type NavigationMode = "push" | "replace";

export const ROUTE_LOCALES = ["en", "pt", "fr", "es", "ru", "zh", "ar"] as const;
export type RouteLocale = (typeof ROUTE_LOCALES)[number];

export type BrowserLocation = {
  path: string;
  search: string;
  hash: string;
  locale: RouteLocale;
  key: string;
};

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/+$/, "");

function stripBasePath(pathname: string) {
  if (!BASE_PATH || BASE_PATH === "/") return pathname;
  if (pathname === BASE_PATH) return "/";
  return pathname.startsWith(`${BASE_PATH}/`) ? pathname.slice(BASE_PATH.length) : pathname;
}

export function normalizePath(pathname: string) {
  const path = stripBasePath(pathname).replace(/\/+$/, "");
  return path || "/";
}

export function splitLocalizedPath(pathname: string) {
  const normalized = normalizePath(pathname);
  const [candidate = ""] = normalized.slice(1).split("/");
  const locale = ROUTE_LOCALES.find((item) => item === candidate) ?? null;
  if (!locale) return { locale, path: normalized };
  const path = normalized.slice(locale.length + 1) || "/";
  return { locale, path };
}

export function readRouteLocale() {
  return splitLocalizedPath(window.location.pathname).locale;
}

export function localizedRouteHref(href: string, locale: RouteLocale) {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const suffixIndex = href.search(/[?#]/);
  const pathname = suffixIndex >= 0 ? href.slice(0, suffixIndex) : href;
  const suffix = suffixIndex >= 0 ? href.slice(suffixIndex) : "";
  const { path } = splitLocalizedPath(pathname);
  if (locale === "en") return `${path}${suffix}`;
  return `${path === "/" ? `/${locale}` : `/${locale}${path}`}${suffix}`;
}

export function readBrowserLocation(): BrowserLocation {
  const { locale: routeLocale, path } = splitLocalizedPath(window.location.pathname);
  const locale = routeLocale ?? "en";
  const { search, hash } = window.location;
  return { path, search, hash, locale, key: `${locale}:${path}${search}${hash}` };
}

export function toBrowserHref(href: string, locale: RouteLocale = readRouteLocale() ?? "en") {
  const localizedHref = localizedRouteHref(href, locale);
  if (!localizedHref.startsWith("/") || localizedHref.startsWith("//") || !BASE_PATH || BASE_PATH === "/") return localizedHref;
  return `${BASE_PATH}${localizedHref}`;
}

export function announceNavigation() {
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function navigateTo(href: string, mode: NavigationMode = "push", locale?: RouteLocale) {
  const browserHref = toBrowserHref(href, locale);
  if (mode === "replace") window.history.replaceState({}, "", browserHref);
  else window.history.pushState({}, "", browserHref);
  announceNavigation();
}

export function navigateToLocale(locale: RouteLocale, mode: NavigationMode = "replace") {
  const { path, search, hash } = readBrowserLocation();
  navigateTo(`${path}${search}${hash}`, mode, locale);
}

export function replaceUrlSilently(href: string, state: unknown = window.history.state, locale?: RouteLocale) {
  const nextHref = href.includes("#") || !window.location.hash ? href : `${href}${window.location.hash}`;
  window.history.replaceState(state, "", toBrowserHref(nextHref, locale));
}

export function scrollToLocation(location: BrowserLocation, behavior: ScrollBehavior = "instant") {
  if (location.hash) {
    let id = location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      // Use the literal hash when it is not valid percent-encoded text.
    }
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: behavior === "instant" ? "auto" : behavior, block: "start" });
      return;
    }
  }
  window.scrollTo({ top: 0, behavior });
}
