# Operations and handoff

## Owners

Repository administrators own Pages settings, branch protection, Actions
permissions, and the `github-pages` environment. Product and programme owners
approve public content, grant metadata, translations, terminology, and media.
Technical maintainers own builds, dependencies, browser compatibility,
external-service integration, and data packaging.

Record named owners in the repository or organizational service catalogue when
the long-term team is assigned; this repository does not invent personal
contacts.

## Release checklist

- [ ] Pull request checks pass.
- [ ] `npm ci` succeeds from a clean checkout.
- [ ] `npm run check` succeeds.
- [ ] Browser journeys pass at desktop and mobile widths.
- [ ] English and each prefixed locale open at the expected route.
- [ ] Grant map, filters, controls, and detail cards work with pointer and
      keyboard input.
- [ ] Dashboard filtering, visualizations, export, and loading behavior work.
- [ ] Stories use local responsive images without layout shift.
- [ ] AI status, streaming response, citations, and failure state are checked.
- [ ] Generated-data record counts and provenance changes are reviewed.
- [ ] No secret, personal, restricted, or unapproved material is present.
- [ ] Pages deployment completes and a deep-link refresh succeeds.

## Production smoke test

After deployment, check:

1. `/sgp-platform/`
2. `/sgp-platform/funding`
3. `/sgp-platform/portfolio`
4. `/sgp-platform/knowledge/studio`
5. `/sgp-platform/stories`
6. `/sgp-platform/fr/portfolio`
7. one unknown URL for the application 404 state

Use browser developer tools to confirm JavaScript, CSS, brand, media, data, and
API-spec files load from `/sgp-platform/`, not the domain root.

## Monitoring

GitHub Pages provides deployment status, not application observability. At
minimum, owners should monitor:

- Pages workflow and environment deployment failures;
- synthetic availability of the root and a deep route;
- JavaScript errors and Core Web Vitals through an approved privacy-safe tool;
- external AI service availability, latency, error rate, and CORS failures;
- repository dependency and secret-scanning alerts;
- generated-data age and provenance.

Any analytics or error-reporting service must complete privacy and security
review before its client is added.

## Incident response

1. Establish whether the failure is static deployment, asset routing, data,
   browser code, or the external AI service.
2. Preserve the failing workflow URL, commit, time, browser, route, and console
   or network evidence without collecting sensitive content.
3. If static content is unsafe, disable Pages while a corrected commit is
   prepared.
4. Revert or fix through normal version control and deploy the verified commit.
5. Run the production smoke test and record the resolution.

Static public journeys should remain available when the AI service is
unavailable. If they do not, treat that coupling as a platform defect.

## Maintenance cadence

- Review dependency and Actions versions monthly.
- Review generated-data freshness on the agreed programme cadence.
- Re-run translation coverage for every interface change.
- Review role and route policy whenever access requirements change.
- Test supported desktop and mobile browsers before material releases.
- Review documentation and the release checklist at least quarterly.

## Migration record

On 2026-07-27 the complete deployable MVP was migrated into
`UNDP-Data/sgp-platform`. Dependencies, build output, test artifacts, and
TypeScript incremental caches were intentionally excluded because they are
reproducible. The destination repository's existing Git history and remote were
preserved; its obsolete graph-library scaffold was replaced by this platform.
