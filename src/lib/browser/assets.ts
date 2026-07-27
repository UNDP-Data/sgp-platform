const EXTERNAL_ASSET_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

/**
 * Resolve a file from Vite's public directory against the configured site base.
 *
 * Keep public asset identifiers canonical (for example `/media/example.webp`)
 * in data and component props, then call this helper at the browser boundary.
 * This allows the same bundle to work at `/` and on a GitHub Pages project path.
 */
export function publicAssetUrl(assetPath: string) {
  if (!assetPath || EXTERNAL_ASSET_PATTERN.test(assetPath)) return assetPath;
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${assetPath.replace(/^\/+/, "")}`;
}
