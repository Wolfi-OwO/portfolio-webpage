# Portfolio Webpage API Reference

The API uses JWT-based authorization for writes and admin routes, and answers hypermedia (`_links`, REST maturity level 3) on every JSON response so a client can start at `GET /api` and follow links from there instead of hardcoding paths.

**Conventions that apply to every endpoint below:**

- Every JSON response carries an `_links` object — the three exceptions are the binary voucher download, any `204 No Content` response (nothing to attach links to), and error bodies (kept in a fixed, link-free shape so a client can rely on it).
- Every route below also answers `HEAD` (same as `GET`, but with the body stripped and, for the voucher, without the file transfer that a real `GET` does) and `OPTIONS` (`200`, with an `Allow` header listing the verbs that route actually supports) — this is Express 5's own built-in behavior, not something this API adds.
- `POST` endpoints that create a resource answer `201 Created` with a `Location` header pointing at it.
- A `GET` by id answers `404` for a well-formed id that doesn't exist, and `400` for a malformed one.
- Public without a token: `/api/projects`, `/api/technologies`, `/api/services`, `/api/availability`, `/api/activity`, `/api/status` and `/api/secret/voucher` (with the right token). `/api/monitors` is admin-only for every verb; creating, updating and deleting anywhere always requires a valid `Bearer` token.

## API root

The hypermedia entry point — one call to discover every other resource, so nothing below has to be hardcoded.

**`GET /api`** — public, responds to `HEAD` and `OPTIONS` like every other endpoint.

```bash
curl http://localhost:8080/api
```

```json
{
  "name": "Portfolio Webpage API",
  "version": "dev",
  "_links": {
    "self": { "href": "/api" },
    "info": { "href": "/api/info" },
    "projects": { "href": "/api/projects" },
    "technologies": { "href": "/api/technologies" },
    "services": { "href": "/api/services" },
    "availability": { "href": "/api/availability" },
    "activity": { "href": "/api/activity" },
    "status": { "href": "/api/status" },
    "monitors": { "href": "/api/monitors" },
    "login": { "href": "/auth/login", "method": "POST" },
    "unlock": { "href": "/auth/unlock", "method": "POST" }
  }
}
```

## Auth

Issues and ends the JWTs every write, and every `/api/monitors` request, depends on. Responds to `HEAD` and `OPTIONS` like every other endpoint.

**`POST /auth/login`** — no auth required. Checks the submitted username/password against the `ADMIN_USER` / `ADMIN_PASSWORD_HASH` environment variables (a bcrypt hash), both required at boot. There is no seeded `admin`/`admin` account.

```bash
curl -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"<ADMIN_USER value>","password":"<the plaintext ADMIN_PASSWORD_HASH was hashed from>"}'
```

```json
{
  "token": "<jwt>",
  "expiresIn": "1h",
  "_links": {
    "root": { "href": "/api" },
    "logout": { "href": "/auth/logout", "method": "POST" }
  }
}
```

**`POST /auth/unlock`** — no auth required, but password-gated. Checks the same admin password and issues a much narrower `secret`-scoped token that only opens the voucher download, not any admin route.

```bash
curl -X POST http://localhost:8080/auth/unlock \
  -H 'Content-Type: application/json' \
  -d '{"password":"<the plaintext ADMIN_PASSWORD_HASH was hashed from>"}'
```

```json
{
  "token": "<jwt>",
  "expiresIn": "30m",
  "_links": {
    "voucher": { "href": "/api/secret/voucher" }
  }
}
```

**`POST /auth/logout`** — requires an admin token. Tokens are stateless and not tracked server-side, so this has nothing to revoke; it exists so the frontend has a symmetric call and a bad/missing token is reported the same way `authMiddleware` reports it everywhere else. Answers `204 No Content` — no body, so no `_links`.

```bash
curl -X POST http://localhost:8080/auth/logout -H 'Authorization: Bearer <jwt>'
```

## Info

Build metadata (version, repository, revision, build date) for the footer's build-info chip.

**`GET /api/info`** — public.

```bash
curl http://localhost:8080/api/info
```

```json
{
  "version": "dev",
  "repositoryUrl": "",
  "revision": "",
  "buildDate": "",
  "_links": {
    "self": { "href": "/api/info" },
    "root": { "href": "/api" }
  }
}
```

## Projects

The project showcase on `/projects`, each with an embeddable list of technologies.

**`GET /api/projects`** — public. Supports `?sort=`, `?limit=`, `?offset=`, `?embed=(technologies)` and field filters. `_links.self` preserves whatever query string was sent.

```bash
curl 'http://localhost:8080/api/projects?embed=(technologies)'
```

```json
{
  "_links": {
    "self": { "href": "/api/projects?embed=(technologies)" },
    "create": { "href": "/api/projects", "method": "POST" }
  },
  "count": 1,
  "items": [
    {
      "_id": "6aba42da2566d674aa973c19",
      "title": "Portfolio Website",
      "description": "A developer portfolio and live status page.",
      "repositoryUrl": "https://github.com/Wolfi-OwO/portfolio-webpage",
      "livedemo": "https://woofi-developments.at",
      "technologies": [],
      "createdAt": "2026-09-28T10:35:06.971Z",
      "updatedAt": "2026-09-28T10:35:06.971Z",
      "_links": {
        "self": { "href": "/api/projects/6aba42da2566d674aa973c19" },
        "update": { "href": "/api/projects/6aba42da2566d674aa973c19", "method": "PUT" },
        "delete": { "href": "/api/projects/6aba42da2566d674aa973c19", "method": "DELETE" },
        "collection": { "href": "/api/projects" }
      }
    }
  ]
}
```

**`GET /api/projects/:id`** — public. `404` if the id is well-formed but nothing matches; `400` if the id itself is malformed.

```bash
curl http://localhost:8080/api/projects/6aba42da2566d674aa973c19
```

```json
{
  "_id": "6aba42da2566d674aa973c19",
  "title": "Portfolio Website",
  "description": "A developer portfolio and live status page.",
  "repositoryUrl": "https://github.com/Wolfi-OwO/portfolio-webpage",
  "livedemo": "https://woofi-developments.at",
  "technologies": [],
  "_links": {
    "self": { "href": "/api/projects/6aba42da2566d674aa973c19" },
    "update": { "href": "/api/projects/6aba42da2566d674aa973c19", "method": "PUT" },
    "delete": { "href": "/api/projects/6aba42da2566d674aa973c19", "method": "DELETE" },
    "collection": { "href": "/api/projects" }
  }
}
```

**`POST /api/projects`** — requires an admin token. Answers `201 Created` with `Location` set to the new project.

```bash
curl -i -X POST http://localhost:8080/api/projects \
  -H 'Authorization: Bearer <jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Portfolio Website","description":"A developer portfolio and live status page.","repositoryUrl":"https://github.com/Wolfi-OwO/portfolio-webpage"}'
```

```
HTTP/1.1 201 Created
Location: /api/projects/6aba42da2566d674aa973c19
```

```json
{
  "_id": "6aba42da2566d674aa973c19",
  "title": "Portfolio Website",
  "description": "A developer portfolio and live status page.",
  "repositoryUrl": "https://github.com/Wolfi-OwO/portfolio-webpage",
  "technologies": [],
  "_links": {
    "self": { "href": "/api/projects/6aba42da2566d674aa973c19" },
    "update": { "href": "/api/projects/6aba42da2566d674aa973c19", "method": "PUT" },
    "delete": { "href": "/api/projects/6aba42da2566d674aa973c19", "method": "DELETE" },
    "collection": { "href": "/api/projects" }
  }
}
```

**`PUT /api/projects/:id`** — requires an admin token. `404`/`400` follow the same rule as the `GET` by id.

```bash
curl -X PUT http://localhost:8080/api/projects/6aba42da2566d674aa973c19 \
  -H 'Authorization: Bearer <jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"livedemo":"https://woofi-developments.at"}'
```

```json
{
  "_id": "6aba42da2566d674aa973c19",
  "title": "Portfolio Website",
  "livedemo": "https://woofi-developments.at",
  "_links": {
    "self": { "href": "/api/projects/6aba42da2566d674aa973c19" },
    "update": { "href": "/api/projects/6aba42da2566d674aa973c19", "method": "PUT" },
    "delete": { "href": "/api/projects/6aba42da2566d674aa973c19", "method": "DELETE" },
    "collection": { "href": "/api/projects" }
  }
}
```

**`DELETE /api/projects/:id`** — requires an admin token. Answers `204 No Content` on success; no body, no `_links`.

```bash
curl -X DELETE http://localhost:8080/api/projects/6aba42da2566d674aa973c19 -H 'Authorization: Bearer <jwt>'
```

## Technologies

The `{tech, color}` tags projects and career entries are tagged with — a shared vocabulary rather than free text on each project.

**`GET /api/technologies`** / **`GET /api/technologies/:id`** — public, same list/item/`404`/`400` shape as projects.

```bash
curl http://localhost:8080/api/technologies
```

```json
{
  "_links": {
    "self": { "href": "/api/technologies" },
    "create": { "href": "/api/technologies", "method": "POST" }
  },
  "count": 1,
  "items": [
    {
      "_id": "6aba42da2566d674aa973c18",
      "tech": "React",
      "color": "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
      "_links": {
        "self": { "href": "/api/technologies/6aba42da2566d674aa973c18" },
        "update": { "href": "/api/technologies/6aba42da2566d674aa973c18", "method": "PUT" },
        "delete": { "href": "/api/technologies/6aba42da2566d674aa973c18", "method": "DELETE" },
        "collection": { "href": "/api/technologies" }
      }
    }
  ]
}
```

**`POST /api/technologies`** — requires an admin token. `201` + `Location`.

```bash
curl -i -X POST http://localhost:8080/api/technologies \
  -H 'Authorization: Bearer <jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"tech":"React","color":"bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300"}'
```

```
HTTP/1.1 201 Created
Location: /api/technologies/6aba42da2566d674aa973c18
```

**`PUT /api/technologies/:id`** / **`DELETE /api/technologies/:id`** — both require an admin token. `PUT` returns the updated technology with `_links`; `DELETE` answers `204 No Content`.

## Services

The pricing cards on `/services` — what I build and what it starts at.

**`GET /api/services`** / **`GET /api/services/:id`** — public reads, but `optionalAuth`: an anonymous caller only ever sees `published: true` entries; a valid admin token also sees drafts. The README used to describe this as admin-only — it isn't; the filtering happens server-side regardless of who's asking.

```bash
curl http://localhost:8080/api/services
```

```json
{
  "_links": {
    "self": { "href": "/api/services" },
    "create": { "href": "/api/services", "method": "POST" }
  },
  "count": 1,
  "items": [
    {
      "_id": "6aba42e02566d674aa973c1a",
      "title": "Website",
      "description": "A fast, accessible marketing website.",
      "category": "web",
      "deliverables": ["Responsive design", "SEO basics"],
      "priceFrom": 600,
      "hourlyRate": 45,
      "duration": "2-4 weeks",
      "order": 0,
      "published": true,
      "_links": {
        "self": { "href": "/api/services/6aba42e02566d674aa973c1a" },
        "update": { "href": "/api/services/6aba42e02566d674aa973c1a", "method": "PUT" },
        "delete": { "href": "/api/services/6aba42e02566d674aa973c1a", "method": "DELETE" },
        "collection": { "href": "/api/services" }
      }
    }
  ]
}
```

**`POST /api/services`** / **`PUT /api/services/:id`** / **`DELETE /api/services/:id`** — all require an admin token. `POST` answers `201` + `Location`; `PUT` returns the updated service; `DELETE` answers `204 No Content`.

```bash
curl -i -X POST http://localhost:8080/api/services \
  -H 'Authorization: Bearer <jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Website","description":"A fast, accessible marketing website.","category":"web","deliverables":["Responsive design","SEO basics"],"priceFrom":600,"hourlyRate":45,"duration":"2-4 weeks"}'
```

## Availability

The homepage's availability rail and, on the same collection distinguished by `track`, the career/education timeline (`?track=career` vs `?track=availability`).

**`GET /api/availability`** / **`GET /api/availability/:id`** — public reads, same `optionalAuth` draft rule as services (also mis-described as admin-only in an earlier version of this README).

```bash
curl http://localhost:8080/api/availability
```

```json
{
  "_links": {
    "self": { "href": "/api/availability" },
    "create": { "href": "/api/availability", "method": "POST" }
  },
  "count": 1,
  "items": [
    {
      "_id": "6aba42e02566d674aa973c1b",
      "title": "Open to freelance work",
      "description": "Available for small projects.",
      "startDate": "2026-10-01T00:00:00.000Z",
      "endDate": null,
      "kind": "available",
      "published": true,
      "track": "availability",
      "_links": {
        "self": { "href": "/api/availability/6aba42e02566d674aa973c1b" },
        "update": { "href": "/api/availability/6aba42e02566d674aa973c1b", "method": "PUT" },
        "delete": { "href": "/api/availability/6aba42e02566d674aa973c1b", "method": "DELETE" },
        "collection": { "href": "/api/availability" }
      }
    }
  ]
}
```

**`POST /api/availability`** / **`PUT /api/availability/:id`** / **`DELETE /api/availability/:id`** — all require an admin token, same `201`/`200`/`204` shape as services.

```bash
curl -i -X POST http://localhost:8080/api/availability \
  -H 'Authorization: Bearer <jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"title":"Open to freelance work","startDate":"2026-10-01","kind":"available"}'
```

## Activity

The GitHub + GitLab contribution heatmap on the homepage, read straight from what the monitor-checker's sync job already wrote to Mongo — no live forge call happens on this request.

**`GET /api/activity`** — public. Optional `?from=&to=` (defaults to the last 365 days).

```bash
curl http://localhost:8080/api/activity
```

```json
{
  "from": "2025-09-29",
  "to": "2026-09-28",
  "days": [{ "date": "2025-09-29", "github": 0, "gitlab": 0, "count": 0 }],
  "repos": [],
  "sources": {
    "github": { "ok": false, "reason": "not-synced", "total": 0, "user": "Wolfi-OwO", "profileUrl": "https://github.com/Wolfi-OwO" },
    "gitlab": { "ok": false, "reason": "not-synced", "total": 0, "user": "WoofiOwO", "profileUrl": "https://gitlab.com/WoofiOwO", "activityUrl": "https://gitlab.com/users/WoofiOwO/activity" }
  },
  "total": 0,
  "backfilling": false,
  "syncedAt": null,
  "_links": {
    "self": { "href": "/api/activity" },
    "root": { "href": "/api" }
  }
}
```

## Monitors

The raw monitor documents (container-app resource names, Metrion keys) behind the status page — admin-only; the public status page reads a separate, sanitized projection from `/api/status` instead.

**`GET /api/monitors`** — requires an admin token. No `GET /:id` route exists (nothing to link a `self` to), so monitor items only carry `update`, `delete` and `collection`.

```bash
curl http://localhost:8080/api/monitors -H 'Authorization: Bearer <jwt>'
```

```json
{
  "_links": {
    "self": { "href": "/api/monitors" },
    "create": { "href": "/api/monitors", "method": "POST" }
  },
  "count": 1,
  "items": [
    {
      "_id": "6aba42e02566d674aa973c1c",
      "name": "Portfolio Website",
      "url": "https://woofi-developments.at",
      "group": "web",
      "metrionKey": "portfolio-web",
      "_links": {
        "update": { "href": "/api/monitors/6aba42e02566d674aa973c1c", "method": "PUT" },
        "delete": { "href": "/api/monitors/6aba42e02566d674aa973c1c", "method": "DELETE" },
        "collection": { "href": "/api/monitors" }
      }
    }
  ]
}
```

**`POST /api/monitors`** — requires an admin token. `201` + `Location` — named for consistency even though there is no `GET /:id` to resolve it with.

```bash
curl -i -X POST http://localhost:8080/api/monitors \
  -H 'Authorization: Bearer <jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Portfolio Website","url":"https://woofi-developments.at","group":"web","metrionKey":"portfolio-web"}'
```

```
HTTP/1.1 201 Created
Location: /api/monitors/6aba42e02566d674aa973c1c
```

**`PUT /api/monitors/:id`** / **`DELETE /api/monitors/:id`** — both require an admin token. `PUT` returns the updated monitor (still no `self`); `DELETE` answers `204 No Content`.

## Status

The public uptime report the status page polls — per-monitor history, grouped and summarized, with the container-app names and raw error text stripped for anonymous callers.

**`GET /api/status`** — public. Optional `?from=&to=` switches to the date-range shape. Cached for 10 seconds server-side; `Cache-Control` reflects that. An admin `Bearer` token adds the infrastructure detail back in.

```bash
curl http://localhost:8080/api/status
```

```json
{
  "status": "pending",
  "checkIntervalMs": 60000,
  "groups": [
    {
      "name": "web",
      "status": "pending",
      "uptime": { "h24": null, "d7": null, "d30": null },
      "monitors": [
        {
          "_id": "6aba42e02566d674aa973c1c",
          "name": "Portfolio Website",
          "url": "https://woofi-developments.at",
          "status": "pending",
          "uptime": { "h24": null, "d7": null, "d30": null },
          "history": [{ "day": 1782864000000, "severity": "no-data", "downPct": null, "downMs": 0, "totalChecks": 0 }]
        }
      ]
    }
  ],
  "_links": {
    "self": { "href": "/api/status" },
    "root": { "href": "/api" }
  }
}
```

## Secret voucher

A one-off, password-gated file download (a gift receipt) proxied out of Azure Blob Storage — never a public URL, so the password is the only thing standing between it and anyone with the link.

**`GET /api/secret/voucher`** — requires a `secret`-scoped token from `/auth/unlock`. Answers the raw PDF bytes with `Content-Type: application/pdf` and a `Content-Disposition` attachment header — no `_links`, this isn't a JSON resource. `HEAD` answers the same headers (including a real `Content-Length`) without transferring the file — fetched via the blob's metadata alone, not by downloading and discarding the body.

```bash
curl http://localhost:8080/api/secret/voucher -H 'Authorization: Bearer <secret-scoped jwt>' -o gutschein-beleg.pdf
```

## Calling a protected endpoint

```bash
curl -X POST http://localhost:8080/api/technologies \
  -H 'Authorization: Bearer <jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"tech":"Rust","color":"bg-orange-100 text-orange-800"}'
```

Unauthenticated or expired-token requests return `401 Unauthorized`.
