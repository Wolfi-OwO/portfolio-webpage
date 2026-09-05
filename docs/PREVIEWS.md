## PR preview infrastructure

Shared infrastructure on the Contabo VPS (167.86.115.79) for per-pull-request
preview deployments of netviz, preussen (dashboard only) and nutrilens. Built
2026-09-05. **This document covers the infrastructure only.** Wiring up the
three repos' own GitHub Actions workflows to call this infrastructure is a
separate, follow-up task — everything below is written so that task doesn't
need to guess anything.

### What already exists vs. what still needs doing

| Piece | Status |
|---|---|
| Caddy routing, on-demand TLS, `ask` abuse guard | Done, tested |
| `/opt/previews/` runner (create/destroy/dispatch/validation) | Done, tested |
| SSH forced-command deploy key | Done, tested (including a real injection attempt) |
| Orphan reaper (systemd timer) | Done, running |
| `netviz` and `preussen` app configs | Done — `IMAGE` points at the real registry path already used in production |
| `nutrilens` app config | **Placeholder** — no production deployment on this box to copy from. `IMAGE` in `apps/nutrilens.conf` is literally `CHANGEME-nutrilens`; fix it before the first nutrilens preview, or `docker pull` fails loudly (correct, not a bug) |
| Per-app preview env vars (`apps/*.env`) | **Empty on all three** — see "Non-production secrets" below |
| Three GitHub Actions workflows | **Not built** — the follow-up task |
| Wildcard DNS records (3x) | **Not set** — the user sets these manually, see "DNS" below |
| `github-token` secret for the reaper (private repo) | **Empty** — see "Orphan reaper" below |

---

## Architecture

### The key: (app, PR number), not the commit

A preview is identified by **`(app, PR number)`**, never by commit sha. This
was a deliberate correction mid-build: the user's stated requirement is that
pushing a new commit to an open PR **replaces** whatever preview was already
running for that PR — never adds a second one. Two previews of the same PR
existing at once would pile up with every push and eventually take the box
down.

This is enforced in `/opt/previews/create.sh` itself, not only in whatever
GitHub Actions workflow calls it — a cancelled or crashed CI run must not
leave two containers answering the same alias. Concretely:

- The container name is `preview-<app>-pr<PR>` — no sha in it. Docker refuses
  a duplicate name, so a fixed name IS the one-container guarantee.
- `create.sh` unconditionally `docker rm -f`s any existing container under
  that name at the start of a run, before checking anything else (including
  the concurrency cap — a redeploy of an already-running PR must never count
  against itself).
- It also deletes the OLD pinned registry file for that PR (see naming
  below) before writing the new one, so a stale, no-longer-backed hostname
  stops passing the Caddy `ask` check going forward.

### Naming

Two hostnames per preview, both aliasing the same container:

```
pr-<pr-number>-<short-sha>.<app>.preview.woofi-developments.at   ← pinned to exactly this commit
pr-<pr-number>.<app>.preview.woofi-developments.at               ← stable across pushes
```

`<app>` ∈ `netviz`, `nutrilens`, `preussen` — its own DNS label, not folded
into the `pr-<n>` label (the user specified this explicitly). Put the
**stable** link in a PR comment; use the **pinned** one only to verify an
exact commit's state, since it changes on every push.

`<short-sha>` is whatever `git rev-parse --short HEAD` / `github.sha`
(truncate to 7+ chars) produces — 7 to 40 lowercase hex characters, validated
by `lib.sh`.

### Request flow (create)

1. CI runs `ssh -i <deploy key> deploy@167.86.115.79 'create <app> <pr> <sha> <tag>'`.
2. `authorized_keys`' forced command routes this into `/opt/previews/run.sh`,
   which parses the one string SSH hands it and dispatches to `create.sh`.
3. `create.sh` validates every argument (`lib.sh`), tears down any existing
   container for this `(app, PR)`, checks the `MAX_PREVIEWS` cap, pulls the
   image, starts the container on `edge-net` with two `--network-alias`
   values (pinned + stable, both **including the app label**, e.g.
   `pr-12-a1b2c3d.netviz`), waits for it to report running/healthy, and only
   THEN writes `/opt/previews/registry/<pinned-hostname>` plus a symlink
   `<stable-hostname> -> <pinned-hostname>`.
4. The first real HTTPS request to either hostname makes Caddy's
   `on_demand_tls` fire its `ask` check against
   `http://127.0.0.1:9444/check?domain=<hostname>` — an internal-only Caddy
   site block that just checks whether a file of that exact name exists
   under the (read-only, bind-mounted) registry directory. Only on a 200
   does Caddy attempt to obtain a certificate at all.
5. Once issued, `reverse_proxy {http.request.host.labels.4}.{http.request.host.labels.3}:8080`
   dials the Docker network alias reconstructed from the hostname's own
   labels — no per-app Caddy config needed, one site block covers all three
   apps.

### Request flow (destroy)

`ssh -i <deploy key> deploy@167.86.115.79 'destroy <app> <pr>'` → `run.sh` →
`destroy.sh`: removes the container, the stable registry symlink, and any
pinned registry file(s) for that PR (there should be at most one, but the
glob handles the case cleanly). Deliberately does **not** touch `caddy_data`
— see "ACME quota" below for why leaving a cached cert behind is the
cheaper choice.

### Orphan reaper

`previews-reaper.timer` (systemd, every 15 minutes, already enabled and
running) executes `/opt/previews/reap-orphans.sh`, which for every registry
entry: (a) tears it down unconditionally if it's ≥7 days old regardless of
API state (a safety net independent of GitHub being reachable at all), else
(b) asks the GitHub API for that PR's state and tears down anything not
`open`.

**Preussen's repo (`Preussen-bot`) is private** — the reaper needs a token to
query it. `/opt/previews/secrets/github-token` exists (600 perms, deploy-
owned) but is **empty**. Until it's populated, preussen previews are only
ever caught by the 7-day age fallback, not by an actual "PR closed" check.
netviz and nutrilens are public repos and work unauthenticated (GitHub's
60 req/hour/IP limit comfortably covers a handful of previews checked every
15 minutes).

To populate it: create a fine-grained GitHub PAT scoped to `Preussen-bot`
only, with **Pull requests: Read** + **Metadata: Read**, nothing else, then
`ssh deploy@167.86.115.79 "cat > /opt/previews/secrets/github-token"` (paste,
Ctrl-D) followed by `chmod 600` (should already be 600, re-check anyway).
This was deliberately **not** generated automatically in this pass — minting
a GitHub credential is a step with a required browser/consent flow, not
something to script blind.

---

## Security

### `ask` endpoint — the abuse guard

Without it, anyone could point an arbitrary hostname's DNS at
167.86.115.79 and Caddy would attempt an ACME order for it on the first
request — burning Let's Encrypt attempts on hostnames nobody controls, and a
genuine abuse vector.

The `ask` endpoint is a second Caddy server block in the SAME Caddyfile
(`http://127.0.0.1:9444`, deliberately with an explicit `http://` — a bare
`127.0.0.1:9444` gets auto-wrapped in TLS by Caddy regardless of the global
`auto_https` setting, exactly the trap this file's own top comment already
documents; hit this for real on first deploy, "Client sent an HTTP request
to an HTTPS server", fixed by adding the scheme). It uses Caddy's own `file`
matcher against a `root` pointed at the registry directory — no separate
process, nothing new to keep alive. Verified directly, 2026-09-05:

- Registered hostname → 200
- Unregistered hostname → 400
- `?domain=../../../../etc/passwd` (path traversal attempt) → 400, Caddy's
  `file` matcher resolves safely against `root` and does not leak outside it

The endpoint is bound to `127.0.0.1` inside the Caddy container (not a bare
`:9444`, which would bind all interfaces inside the container) AND the port
is never published in `docker-compose.prod.yaml` — two independent reasons
it cannot be reached from outside the container, confirmed with an external
port scan (22/80/443 open, 9444 filtered).

### Forced command / input validation

`previews-ci-deploy`'s public key in `authorized_keys` carries
`command="/opt/previews/run.sh",restrict` — that key can run **only** this
one script, regardless of what the SSH client asks for (`restrict` also
strips agent/port/X11 forwarding, matching the existing `netviz-ci-deploy`
key's own restrictions). `run.sh` reads `SSH_ORIGINAL_COMMAND`, word-splits
it into an argv array (never through `eval`/`sh -c`, so shell metacharacters
in any word are inert), and dispatches only `create`/`destroy`.

Every value — app name, PR number, commit sha, image tag — is validated
against a strict allow-list regex in `lib.sh` before it touches a
container name, a Docker network alias, a filename, or `docker pull`'s
argument. Tested directly against the real deploy key, 2026-09-05:

```
$ ssh -i previews-ci-deploy deploy@167.86.115.79 'create netviz "1; whoami; sudo cat /etc/shadow" abc1234 v1.0.0'
Refusing PR number '"1;' — must be a positive integer.

$ ssh -i previews-ci-deploy deploy@167.86.115.79 'whoami'
Refusing action 'whoami' — only 'create' and 'destroy' are allowed.

$ ssh -i previews-ci-deploy deploy@167.86.115.79 'create evilapp 1 abc1234 v1.0.0'
Refusing app 'evilapp' — not an onboarded preview app.
```

`app` is checked against BOTH a charset regex AND a fixed whitelist array in
`lib.sh` (`PREVIEW_APPS=(netviz nutrilens preussen)`) — onboarding a fourth
app means editing that array and adding a `.conf` file, both by hand,
deliberately not automatic.

### Non-production secrets

**No production secret or database is ever referenced by anything under
`/opt/previews/`.** Each app's env file (`apps/<app>.env`) starts empty and
must be filled in with FRESH, preview-only credentials during onboarding —
never copied from `/opt/netviz/.env`, `/opt/preussen/.env`, or nutrilens'
own production env. A container that needs an env var to boot and doesn't
have one fails its health check and never gets registered — this was
observed directly during verification (netviz refused to start without a
`JWT_SECRET`, then refused again without a real Mongo connection) and is the
correct, visible failure mode, not a bug to route around.

For nutrilens specifically: **must not run against the production
database.** Either give it its own disposable/ephemeral database per
preview (a second small container on the same network, torn down alongside
it — same pattern used for this task's own end-to-end verification, see
below) or, if the app tolerates it, no `DB_*` vars at all. Document whichever
choice the onboarding agent makes directly in `apps/nutrilens.conf`.

### Preussen bot lock

A preview can only ever run the **dashboard**. `apps/preussen.conf` hardcodes
`IMAGE=globalcr01.azurecr.io/preussen/web` — CI only ever supplies a `TAG`
(validated against a charset regex), never a repository path, so there is
no input any workflow run — malicious or merely buggy — can pass through
`run.sh` → `create.sh` that resolves to `.../preussen/bot`. This is a
structural guarantee, not a runtime flag: unlike production's
`docker-compose.prod.yml` (`profiles: ['bot']`), there is no compose file
here to have a profile in the first place — the bot image path is simply
never written anywhere in the preview code path.

---

## Limits

### Resource budgets (per preview)

| App | mem_limit | cpus | Basis |
|---|---|---|---|
| netviz | 128m | 0.25 | Reused, not re-measured — this is the SAME ceiling `/opt/netviz/docker-compose.prod.yml` already runs, itself 3.5x netviz's own measured 37.1 MiB RSS peak (`docker stats`, 2026-09-05). A preview carries less traffic than prod. |
| preussen (dashboard) | 256m | 0.4 | Budget allocation: half of the dashboard's own prod ceiling (512m), itself ~2.9x a measured 176 MiB Azure Monitor peak. Re-measure with `docker stats` after the first real preview and raise only if approached. |
| nutrilens | 256m | 0.4 | Budget allocation, not a measurement — no prior deployment to measure. Matches this project's own convention for a small Node/Next app of preussen-dashboard's size class. Re-measure after the first real preview. |

`memory-swap` is always set equal to `memory` (zero swap) — same reasoning
as every other stack on this box: a leaking preview gets OOM-killed and
restarted rather than dragging the whole VM down through swap I/O.

### Concurrency cap

`MAX_PREVIEWS=6`, hardcoded in `create.sh`. Sized against what this box
already commits to production: portfolio (1.5 vCPU / 1664 MiB) + preussen
(1.0 / 1024 MiB) + netviz (0.3 / 128 MiB) ≈ 2.8 vCPU / 2.8 GiB. Six previews
at their largest per-app budget (256 MiB / 0.4 cpu) add at most another
1.5 GiB / 2.4 vCPU — comfortably inside the box's 4 vCPU / 8 GiB even with
everything running simultaneously, with headroom left for the OS, Docker
daemon, page cache and restic.

**On hitting the cap: the new deploy FAILS with a clear message**, it does
not evict the oldest preview. Silently killing someone else's active
review environment because a newer PR happened to get scheduled would be
far more surprising than a CI job failing with "6 previews already running,
close an old PR preview first" — which is actionable and gives the reviewer
a reason to close a stale PR. Verified directly: simulated 6 active
previews, a 7th `create` call was refused with exactly that message.

### ACME / Let's Encrypt quota

Let's Encrypt allows 50 certificates per registered domain per week —
shared across the five production hostnames (essentially never renewed
this soon; certs are valid to Dec 2026) and every preview hostname `on_demand_tls`
ever issues. Each preview issues **two** certs the first time it's ever
used (stable + pinned hostname) — subsequent pushes to the SAME pr only add
one new cert (the new pinned hostname; the stable one already has a cached
cert that keeps working, since Caddy's cert cache is per-hostname and
doesn't care what currently answers behind it).

`destroy.sh` deliberately never touches `caddy_data` — a hostname's cached
cert survives teardown. This means: closing and reopening a PR, or retrying
a CI run that lands on the exact same commit sha, reuses the cached cert for
free. A genuinely new commit always needs a genuinely new cert (there is no
way around that while guaranteeing per-commit isolation, which is the
explicit point of the pinned hostname).

Worst-case math: with `MAX_PREVIEWS=6` and every one of them getting a
brand-new commit sha within the same week, that's at most 6 stable-hostname
certs (mostly already cached after the first push) + up to a few dozen
pinned-hostname certs across all pushes that week — nowhere near 50. If
review velocity ever gets high enough to approach it, the fix is at the
workflow level (debounce rapid pushes, only preview on `opened`/
`reopened`/a manual label rather than every `synchronize`), not here.

### Why `on_demand_tls` and not GoDaddy DNS-01 wildcard certs

A mid-build instruction proposed switching to GoDaddy DNS-01 wildcard certs
(`/home/woofi/.env` contains `KEY`/`SECRET`, apparently GoDaddy production
API credentials) specifically to sidestep the 50/week limit and the `ask`
endpoint entirely. **This was investigated, built partway, and reverted —
here is exactly what was measured:**

- Fixed `/home/woofi/.env` from mode 644 → 600 (was readable by every user
  on the machine; not appropriate for a credential file). Confirmed it is
  not tracked in any git repository.
- Built a custom Caddy binary with the `caddy-dns/godaddy` module via
  `xcaddy`, **on the local machine, not the VPS** (per the "no builds on
  the VPS" constraint) — pinned to the exact same Caddy version
  (`v2.11.4`) already running in production, verified with `caddy version`
  both locally and after copying it to the VPS. It currently sits unused at
  `/opt/portfolio/caddy-godaddy` — a strict superset of the stock
  `caddy:alpine` binary, zero downside to leaving it there, but **not**
  wired into the running container.
- Tested the credentials against `api.godaddy.com` — from both the local
  machine and the VPS itself, against the domain-info endpoint AND the
  exact DNS-records endpoint the `godaddy` Caddy module would call. Every
  single call — with the real credentials, AND with a deliberately bogus
  `Authorization` header — returned the identical signature: `401`, empty
  body, Akamai bot-manager cookies (`_abck`, `bm_sz`), `x-error-info: 1`.
  The OTE (sandbox) endpoint, by contrast, returned a real JSON error body
  (`"NOT_FOUND"`) for the same credentials.
- **Conclusion: this environment cannot distinguish valid from invalid
  GoDaddy credentials right now** — `api.godaddy.com` is edge-blocking
  everything before it reaches GoDaddy's actual auth/app layer, for both
  real and fake credentials alike, from both source IPs tested. This is
  consistent with GoDaddy's account-level API access restrictions
  (introduced ~2023, generally requiring 10+ domains under management or
  Discover Program enrollment) or WAF-level bot-blocking — not something
  resolvable from curl/Caddy alone.
- Given the explicit instruction to provoke **zero** ACME failed-validation
  attempts, and no way to confirm the DNS-01 path would actually work,
  wiring this into production Caddy was not a responsible move: a
  DNS-01 attempt that fails at the "set the TXT record via GoDaddy" step
  fails before ever reaching Let's Encrypt (safe), but there was no way to
  verify that boundary held without first fixing the credential/API access
  problem, which is outside this task's reach (it requires the user's own
  GoDaddy account, not a technical fix).

**This needs the user's direct attention on the GoDaddy account side**
(check the API key's status page at developer.godaddy.com, or account
messages about API access being restricted) before DNS-01 is worth
revisiting. Until then, `on_demand_tls` — already built, tested end-to-end,
and not subject to this problem at all (it talks to Let's Encrypt, not
GoDaddy) — is the working mechanism, and comfortably clears the 50/week
quota at this project's realistic scale (see math above).

---

## DNS

**Three records needed, one per app** (a wildcard only ever matches one
additional label — `pr-12-a1b2c3.netviz.preview...` has TWO labels below
`.preview.woofi-developments.at`, so a single `*.preview` wildcard does not
cover it; `<app>` needs its own wildcard level):

```
*.netviz.preview       A     167.86.115.79     TTL 600
*.nutrilens.preview     A     167.86.115.79     TTL 600
*.preussen.preview      A     167.86.115.79     TTL 600
```

These were **not** set automatically — the GoDaddy API access problem above
means there is currently no scriptable path to GoDaddy DNS from here either
(the DNS Records API is the same `api.godaddy.com` surface that returned an
edge-blocked 401 for everything tested). Enter them manually in the GoDaddy
DNS management UI for `woofi-developments.at`, exactly as written above.

Everything preview-related was tested against the VPS's IP directly via
`curl --resolve`/`docker exec` from inside the Caddy container (see
"Verification output" in the delivery report) — that proves the container
lifecycle, the network routing, and the `ask` abuse guard all work. **What
specifically still needs the real DNS record before it works**: the actual
`on_demand_tls` certificate issuance and a real browser being able to open
a preview URL — Let's Encrypt validates a domain by reaching it over the
real internet, which needs the real A record in place first.

---

## How to onboard a repo

For each of netviz, nutrilens, preussen:

1. **Fix the app config if needed.** `apps/nutrilens.conf` currently has a
   placeholder `IMAGE` — set it to the real ACR path once nutrilens has one.
   netviz and preussen are already correct (copied from their existing
   production compose files).
2. **Populate `apps/<app>.env`** with fresh, preview-only env vars (never
   copy a production `.env`). At minimum whatever the app needs to boot
   (e.g. a JWT/session secret — generate a new random one, it does not need
   to match anything) and, if the app needs a database, a connection string
   to something that is NOT production (see "Non-production secrets" and
   nutrilens's specific DB constraint above). If unsure what an app needs,
   run `create.sh` by hand once and read the container's own log output —
   it will say exactly what's missing (this is how netviz's own two
   required vars were discovered during this task's verification).
3. **Retrieve the CI deploy key**: `ssh deploy@167.86.115.79 "cat /opt/previews/secrets/ci_deploy_key"`
   (600 perms, deploy-owned) and add it to the repo as a GitHub Actions
   secret (e.g. `PREVIEW_SSH_KEY`). All three repos can share this ONE key —
   it is restricted server-side to `run.sh`, which itself validates `app`
   against the fixed whitelist, so sharing it across repos does not let one
   repo's CI deploy a preview under another app's name.
4. **Add the host key** (`ssh-keyscan 167.86.115.79`) as a `known_hosts`
   secret/step, or use `StrictHostKeyChecking=accept-new` in CI — either is
   fine, this box's host key has not changed since the netviz deploy key was
   set up.
5. **Write the workflow.** On PR open/sync (not every push if that gets
   noisy — see the ACME quota note above for why): build/push the image the
   same way the existing deploy workflows do (netviz's own
   `.github/workflows/deploy.yml` is the closest existing example — same
   ACR, same "no build on the VPS" rule), then:
   ```
   ssh -i <key> deploy@167.86.115.79 'create <app> <pr-number> <short-sha> <tag>'
   ```
   Post the **stable** URL (first line of that command's stdout) as a PR
   comment. On PR close/merge:
   ```
   ssh -i <key> deploy@167.86.115.79 'destroy <app> <pr-number>'
   ```
6. **Share the basic-auth password** with whoever reviews PRs:
   `ssh deploy@167.86.115.79 "cat /opt/previews/secrets/basic_auth_password.txt"`.
   Username is `preview`. This is a shared, low-value, disclosable password —
   not a production secret — whose only job is keeping bots/search engines
   off preview URLs; it is fine to paste directly in a PR comment or a team
   channel. Embeddable directly in a link as
   `https://preview:<password>@pr-12.netviz.preview.woofi-developments.at`.
7. **Populate the reaper's GitHub token** if the repo is private (only
   `Preussen-bot` currently is) — see "Orphan reaper" above.

### Files on the server (for reference, do not need to be re-created)

```
/opt/previews/
  lib.sh                  # shared input validation
  create.sh               # forced-command target: create/replace a preview
  destroy.sh              # forced-command target: teardown a preview
  run.sh                  # SSH forced-command dispatcher (create.sh | destroy.sh)
  reap-orphans.sh         # run by previews-reaper.timer every 15 min
  apps/
    netviz.conf / .env
    nutrilens.conf / .env  # .conf has a placeholder IMAGE, see above
    preussen.conf / .env
  registry/               # one file per active preview hostname (+ a symlink per stable alias) — what the Caddy `ask` endpoint checks
  secrets/
    ci_deploy_key          # private half of the previews-ci-deploy SSH key
    basic_auth_password.txt
    github-token           # empty — see "Orphan reaper"

/etc/systemd/system/previews-reaper.{service,timer}   # enabled, running

authorized_keys entry:
  command="/opt/previews/run.sh",restrict ssh-ed25519 ...previews-ci-deploy
```
