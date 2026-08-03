# Data and content

## Runtime package

All data needed by the static portfolio, maps, stories, and knowledge discovery
experience is committed under `public/generated/`. The current provenance
manifest records:

| Artifact | Records |
| --- | ---: |
| Normalized projects | 30,753 |
| Cofinancing rows | 56,808 |
| World-country features | 249 |
| Country content profiles | 139 |
| Editorial index | 3,316 |
| Archive knowledge index | 29,384 |

`public/generated/provenance.json` also includes schema version, validation
state, and SHA-256 hashes. `npm run validate:data` is the executable contract
for the packaged artifacts.

The open-grant list in `src/data/open-grants.ts` is curated MVP metadata. Treat
deadlines, eligibility, funding values, and agency ownership as demonstration
content until an approved live opportunity source replaces it.

The operational workspace starts from public-safe records in
`src/workspace/workflowDefinitions.ts`. In connected development, mutations,
transitions, notes, audit, support, preferences and evidence persist through the
temporary backend under `.local/backend`. The browser store and IndexedDB remain
an offline fallback, and versioned workspace backups include evidence bytes.
These are functional product-validation records, not authoritative programme
records. Never enter personal, unpublished, restricted or confidential
material.

## Refresh procedure

Use a compatible local data-pipeline export:

```bash
SGP_DATA_PIPELINE_DIR=/absolute/path/to/pipeline npm run sync:data
npm run validate:data
npm run check
```

Alternatively set `SGP_PIPELINE_API` to the pipeline's API export directory.
The sync command validates inputs, copies only runtime artifacts, prepares the
knowledge indexes, and updates provenance. Review record-count changes and
source hashes before committing them.

The application must remain deployable from this repository alone. Never add a
runtime fetch to a developer filesystem path or a sibling checkout.

## Images

Platform, grant, dashboard, archive, and story images are stored locally under
`public/media/` or `public/brand/`. `scripts/cache-story-images.mjs` owns the
story cache and responsive variants; its generated manifest is
`src/generated/story-image-cache.json`.

For new images:

1. Confirm rights and attribution.
2. Store a sensibly sized original only when it is needed.
3. Generate responsive WebP variants.
4. Record intrinsic dimensions to prevent layout shift.
5. Use `OptimizedImage` with accurate `sizes`.
6. Keep remote source and attribution metadata where required.

Do not reintroduce remote hotlinked story thumbnails. Large new data or media
files should be reviewed against GitHub repository and Pages artifact limits
before merge.

## Content ownership

Generated records preserve their stated source and are not rewritten in the
browser. Editorial language, translations, grant demonstrations, image rights,
and programme claims require review by the appropriate SGP content owner.
Technical validation confirms structure and provenance; it does not constitute
programme approval.
