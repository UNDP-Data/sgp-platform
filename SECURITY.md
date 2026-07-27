# Security policy

## Reporting

Do not disclose a suspected vulnerability in a public issue. Use the
repository's private vulnerability-reporting or Security Advisory feature when
enabled, or contact the UNDP repository owners through an approved internal
channel. Include affected routes, reproduction steps, impact, and a minimal
proof of concept without real personal or confidential data.

## Scope

The current GitHub Pages deployment is a public MVP. Its role selector and
client route policy are not authentication or authorization. No restricted
programme records, personal data, credentials, or operational secrets may be
placed in the frontend or static artifacts.

Secrets committed to Git remain compromised even if removed in a later commit.
If exposure occurs, notify the repository owners immediately, revoke the value,
review access logs, and follow the organizational incident process.

Dependency and Actions security updates should be tested through a pull request
and released promptly according to severity. Never weaken content, Pages, or
workflow permissions merely to make a failing deployment pass.
