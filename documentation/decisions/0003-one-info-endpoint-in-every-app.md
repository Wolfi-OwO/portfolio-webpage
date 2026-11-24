# 0003. One info endpoint in every app

- **Status:** Accepted
- **Date:** 2026-11-24

## Context

Five apps run on one server (this portfolio, Burrow, Nutrilens, NetViz, Metrion). To see which version of each is live
you had to know where each one hid it: `/api/info` here, `/api/version` in Burrow, `/version` in Nutrilens, nothing
at all in NetViz and Metrion. A release could succeed in CI and still leave you unsure what was answering.

## Decision

Every app answers `GET /api/info`, public, no credentials, JSON:

```json
{
  "name": "burrow",
  "version": "v1.6.1",
  "revision": "678ae95ee683a3ef2372e333649ff1d5e186f4cc",
  "buildDate": "2026-11-24T16:03:37Z",
  "repositoryUrl": "https://github.com/Wolfi-OwO/burrow"
}
```

- The field names are the ones this stack already used (`version`, `revision`, `buildDate`, `repositoryUrl`) plus
  `name`, so nothing that reads them changes. They line up with the OCI image annotations
  (`org.opencontainers.image.version`, `.revision`, `.created`, `.source`) and with what Spring Boot's
  `/actuator/info` reports, the convention most other stacks follow.
- The values reach the running app as `APP_VERSION`, `APP_REVISION`, `APP_BUILD_DATE` and `APP_REPOSITORY_URL`,
  set by the Dockerfile from build args the release workflow passes. Outside a real image the version is `dev` and
  the rest is empty; nothing is invented.
- A version reads like the release tag (`v1.6.1`), whichever way the build arg was written.
- The older paths (`/api/version`, `/version`) stay and return the same content, so existing readers keep working.
- Liveness and readiness stay as they are (`/livez`, `/readyz`, the Kubernetes convention). `/api/info` says what is
  running; it does not say whether it is healthy.
- Metrion has two HTTP services (ingest and viewer); each answers it with its own name and version.

## Consequences

One request tells you what is deployed anywhere in the stack, and the status page could show it. Adding an app means
adding this endpoint; there is no shared library, because the apps share no runtime code.
