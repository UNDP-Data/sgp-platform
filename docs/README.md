# Platform documentation

This directory is the maintained, repository-local documentation set for the
SGP Knowledge and Learning Platform. It is deliberately self-contained so a
fresh GitHub Actions checkout can be built, verified, operated, and handed over
without access to the former workspace layout.

## Documents

- [Architecture](ARCHITECTURE.md): runtime boundaries and code organization.
- [Deployment](DEPLOYMENT.md): GitHub Pages setup, release, rollback, and
  troubleshooting.
- [Configuration](CONFIGURATION.md): build-time settings and external services.
- [Routing and localization](ROUTING_AND_LOCALIZATION.md): URL, subpath, SPA,
  and language behavior.
- [Data and content](DATA_AND_CONTENT.md): committed artifacts, provenance, and
  refresh procedure.
- [Access and roles](ACCESS_AND_ROLES.md): MVP role model and production
  security boundary.
- [Operations](OPERATIONS.md): release checklist, monitoring, recovery, and
  ownership handoff.

The root [README](../README.md) is the developer entry point. Changes to
behavior, routes, deployment, data contracts, or operational assumptions must
update the corresponding document in the same pull request. `npm run
docs:check` validates this index, local links, deployment files, stale
repository references, and alignment with the 83-pattern sitemap.
