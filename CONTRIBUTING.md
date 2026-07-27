# Contributing

Use a short-lived branch and a pull request into `main`.

## Development

```bash
npm ci
npm run dev
```

Before requesting review:

```bash
npm run check
npm run test:e2e
```

Keep changes scoped, preserve unrelated work, and include tests and
documentation for behavior or contract changes. Do not commit `node_modules/`,
`dist/`, test output, local environment files, credentials, or restricted data.

Internal application links must use `AppLink` or the navigation helpers. Public
assets used from TypeScript or JSX must use `publicAssetUrl` or
`OptimizedImage`. New interface strings require all supported translations.
Generated data must be refreshed through the supplied scripts and committed
with updated provenance.

Programme claims, grant metadata, official terminology, translations, and
media rights require the relevant content-owner review. Security-sensitive
changes require a security reviewer. See [the documentation
index](docs/README.md) for the maintained contracts.
