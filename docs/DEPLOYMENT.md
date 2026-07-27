# GitHub Pages deployment

## Target

The production project-site URL is:

`https://undp-data.github.io/sgp-platform/`

The repository remote is:

`https://github.com/UNDP-Data/sgp-platform.git`

The deployment workflow is
`.github/workflows/deploy-pages.yml`. It verifies the repository, builds with
`BASE_PATH=/sgp-platform/`, uploads one Pages artifact, and deploys through the
protected `github-pages` environment.

## One-time repository setup

An administrator must open **Settings → Pages** and select **GitHub Actions** as
the publishing source. The workflow then creates or uses the `github-pages`
environment. If organizational policy requires approval, add the appropriate
reviewers to that environment.

The workflow permissions are intentionally narrow:

- build: `contents: read`
- deploy: `contents: read`, `pages: write`, and `id-token: write`

No deploy key, personal access token, Pages branch, or committed build output is
needed.

## Release

1. Run `npm ci`.
2. Run `npm run check`.
3. Optionally run `npm run test:e2e` for the full browser suite.
4. Review generated-data provenance and the visible principal journeys.
5. Merge to `main`.
6. Confirm the **Deploy GitHub Pages** workflow completed.
7. Open the production root and at least one deep localized route, such as
   `/sgp-platform/fr/portfolio`.

The workflow is also available through `workflow_dispatch` for a manual
deployment of the current branch state.

## Reproduce the Pages build locally

```bash
npm ci
BASE_PATH=/sgp-platform/ npm run build
BASE_PATH=/sgp-platform/ npm run preview
```

Open `http://127.0.0.1:4173/sgp-platform/`. Check `dist/index.html` and
`dist/404.html` when diagnosing deep-link behavior.

## Rollback

GitHub Pages deployments are artifacts of repository commits. Revert the
problematic commit on `main` or restore a known-good revision through a pull
request; the normal workflow will publish the recovered state. Do not edit
`dist/` or create a separate deployment branch.

For an urgent service interruption, repository administrators may disable the
Pages deployment in Settings while the corrective commit is prepared. Record
the incident and validation evidence described in [Operations](OPERATIONS.md).

## Custom domains

No custom domain is configured in this repository. If one is approved later:

1. Configure it in **Settings → Pages** before changing application
   configuration.
2. Add and verify the required DNS records.
3. Enforce HTTPS after GitHub validates the domain.
4. Re-test SPA deep links, locale routes, AI CORS, canonical links, and asset
   paths.

Do not add a speculative `CNAME` file.

## Troubleshooting

### A page loads but images or downloads fail

Confirm the workflow built with `BASE_PATH=/sgp-platform/`. Public files used
from React must pass through `publicAssetUrl` or `OptimizedImage`. Run the same
base-path build locally; the post-build audit rejects common domain-root URLs.

### A deep link displays the GitHub 404 page

Confirm `dist/404.html` exists in the uploaded artifact and is identical to
`dist/index.html`. Confirm the requested path begins with `/sgp-platform/`.

### The AI assistant fails while the rest of the site works

Inspect the browser network response from the external AI endpoint. Confirm
that the service is healthy and allows the Pages origin
`https://undp-data.github.io`. No AI credential is stored in this frontend.

### The workflow cannot deploy

Confirm Pages uses **GitHub Actions**, the workflow has permission to create a
deployment, and any required `github-pages` environment approval was granted.
The build and verification logs should be resolved before retrying deployment.
