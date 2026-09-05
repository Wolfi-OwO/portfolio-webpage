# Contabo VPS migration


## Server access

The Contabo VPS is key-only. There is no password login for any account.

| | |
|---|---|
| Host | `167.86.115.79` |
| Port | `22` (unchanged — the GitHub Actions deploy targets 22) |
| User | `deploy` (non-root, passwordless sudo, member of `docker`) |
| Private key | `~/.ssh/contabo_vps` (ed25519, mode 600) |
| Public key | `~/.ssh/contabo_vps.pub` |
| Key fingerprint | `SHA256:wyNC0150yG4nLZjwdwN5o3DOHp2K6I/C/sHrwOlTt+E` |
| Host key (ed25519) | `SHA256:ThFjcc7MmJ7XcKWJzm/Jzb+Jml2W+CbzGNHhn/dWl0w` |
| OS | Ubuntu 24.04.4 LTS |

```sh
ssh -i ~/.ssh/contabo_vps deploy@167.86.115.79
```

`~/.ssh/id_rsa` is used for other hosts and is deliberately not authorised here.

### Hardening in place

- `sshd`: `PasswordAuthentication no`, `PermitRootLogin no`, `KbdInteractiveAuthentication no`
- `ufw`: default deny incoming, allow 22/tcp, 80/tcp, 443/tcp, 443/udp
- `fail2ban`: `sshd` jail, 5 failures / 600 s ban, journald backend
- `unattended-upgrades`: enabled, driven by `apt-daily-upgrade.timer`
- `root` and `ubuntu` accounts have locked passwords; `deploy` has no password at all

### Where to change SSH auth policy

`/etc/ssh/sshd_config.d/10-hardening.conf` — and only there.

Contabo ships `ssh_pwauth: true` in the instance user-data, so cloud-init rewrites
`/etc/ssh/sshd_config.d/50-cloud-init.conf` back to `PasswordAuthentication yes` on
every boot. Setting `ssh_pwauth: false` in `/etc/cloud/cloud.cfg.d/` does not stop it,
because datasource user-data outranks `cloud.cfg.d`. `sshd` takes the first value it
reads per keyword, so a drop-in numbered below 50 wins. A file numbered above 50 will
be silently overruled.

### Open item for the account owner

The Contabo **panel** password is unchanged and was previously exposed. Rotating it can
only be done in the Contabo web panel, by the account owner. Until then the panel remains
a path to the server (rescue system, VNC console, reinstall) that this hardening cannot close.


## Cost: what was measured

All figures below were pulled read-only on 2026-09-04. Every number is labelled
**measured** (it came out of an Azure API) or **derived** (it was computed from a
measured unit price). The two are never mixed in one column, because the derived
half is a hypothesis and the measured half is not.

### Method

| What | How |
|---|---|
| Actuals | Cost Management query API, `api-version=2023-11-01`, `ActualCost` |
| Timeframe | `Custom` with an explicit `timePeriod`. This API version rejects `TheLastMonth` with `BadRequest` |
| Rate limiting | The endpoint answers `429 Too Many Requests` constantly; the queries were retried with exponential backoff (10 s doubling, then 45 s steps) |
| Unit prices | Public Azure Retail Prices API, <https://prices.azure.com/api/retail/prices>. Nothing here comes from memory or a blog post |
| Container memory/CPU | Azure Monitor `WorkingSetBytes` / `UsageNanoCores`, hourly, 2026-08-28 → 2026-09-04 |

### Measured actuals

Grouped by `ServiceName`, currency EUR.

| Service | July 2026 | August 2026 | Sept 1–4 (MTD) |
|---|---:|---:|---:|
| Azure Container Apps | 12.5654 | 10.0967 | **0.0000** |
| Container Registry | 4.9245 | 4.5378 | 0.4888 |
| Storage | 2.7677 | 1.2803 | 0.0163 |
| Virtual Machines | 0.6048 | — | — |
| Virtual Network | 0.8381 | — | — |
| Bandwidth | 0.0000 | 0.0000 | — |
| App Service / Functions / Log Analytics / PostgreSQL | 0.0000 | 0.0000 | 0.0000 |
| **Total** | **21.7005** | **15.9147** | **0.5051** |

Grouped by `ResourceGroupName`:

| Resource group | July 2026 | August 2026 | Sept 1–4 |
|---|---:|---:|---:|
| portfolio-webpage-rg | 6.4605 | 5.9895 | 0.0163 |
| global-utils | 4.2914 | 4.5378 | 0.4888 |
| netviz-rg | 3.5056 | 0.0385 | 0.0000 |
| dsai-5bhif-app | 4.0932 | 0.1264 | 0.0000 |
| nutrilens-rg | — | 5.2226 | 0.0000 |
| minecraft-server | 3.3499 | — | — |

Two things in that table are worth stating plainly rather than glossing over:

- **`minecraft-server`, `Virtual Machines` and `Virtual Network` existed in July and
  do not exist now.** Part of the July→September drop is deleted resources, not the
  free tier.
- **Container Apps was billed 10.10 EUR in August and 0.00 EUR in the first four days
  of September.** The free-tier promotion did not change on 1 September, so the
  promotion is not what explains this.

### Why the September number is not a monthly run rate

The brief this document was written against quotes **3.79 EUR/month**. That figure is
`0.5051 EUR / 4 days x 30.44`. The arithmetic is right and the conclusion drawn from it
is wrong, so it is recorded here as a **derived** figure with its defect named:

Azure Container Apps includes a **permanent monthly free grant** of 180,000 vCPU-seconds
and 360,000 GiB-seconds per subscription. That is a fixed monthly *allowance*, not a
discounted *rate*. Extrapolating any partial month linearly therefore understates the
month systematically, because the first days of every month are spent inside the grant
and cost nothing.

Measured check: `portfolio-app` runs at 0.5 vCPU. Four days of it alone is
`4 x 86,400 x 0.5 = 172,800` vCPU-seconds — 96 % of the 180,000 monthly grant, consumed
by one app in four days. Billing for Container Apps in September had not started yet at
the moment of measurement; it was about to.

**The best available estimate of what a full month on Azure costs today is August's
measured 15.91 EUR, not the extrapolated 3.79 EUR/month.** July was 21.70 EUR. Both are
measured; the 3.79 is derived from a window too short for the billing model.

### Why Container Apps and PostgreSQL show 0.00 EUR

Measured on the subscription (`az rest` against
`/subscriptions/5698eb78-1994-4a3e-b97a-b3bcd04df87f?api-version=2022-12-01`):

```json
"quotaId": "PayAsYouGo_2014-09-01",
"spendingLimit": "Off",
"promotions": [{ "category": "freetier", "endDateTime": "2026-12-19T11:54:11.6154532Z" }]
```

The free-tier promotion ends **2026-12-19**. It is a real discount and it does end. But
note the ordering problem above: the promotion was equally active in July and August,
when Container Apps was billed 12.57 and 10.10 EUR. So the promotion alone does not
explain a zero — the monthly free grant, the deleted VM/vnet resources and the apps now
sitting at `minReplicas: 0` do. **After 2026-12-19 both effects go away at once.**

`spendingLimit: "Off"` means there is no ceiling. Nothing stops a misconfigured
`minReplicas` from billing indefinitely. That is what the budget below exists for.

### Verdict

> **Migrating today saves nothing.** Azure currently costs 3.79 EUR/month; the VPS costs
> 6.50 EUR/month, so running both is more expensive than Azure alone. The VPS is already
> bought and is a sunk cost. The migration only pays for itself after **2026-12-19**.

That verdict is stated on the 3.79 EUR/month basis it was agreed on, and it is the
conservative reading. The measured correction above cuts the other way and must not be
hidden: **if a full month today really costs what August cost (15.91 EUR), the VPS at
6.50 EUR/month would already be cheaper.** Which of the two is true depends on whether
September ends nearer 0.51 EUR or nearer 16 EUR, and that cannot be known before the
month closes.

**This is an open question, not a settled one.** Re-run the September query after
2026-10-01 and replace this paragraph with the answer. Until then: there is
**no saving today** that can be demonstrated from data, and the migration should be
justified by control, latency and the post-promotion forecast — not by this month's bill.

### Post-2026-12-19 forecast — derived, with the arithmetic shown

Every euro below is `measured unit price x derived quantity`. The unit prices are in the
table after this one so any line can be rechecked by hand.

The Retail Prices API publishes its **EUR** figures for Container Apps per-second meters
rounded to 4 decimals, which renders them as `0.0000` — unusable. The **USD** feed keeps
full precision, so the USD price is used and converted. The conversion factor is not
guessed: it is the ratio between the EUR and USD feeds for five unrelated meters that
*do* have precision in both, which agree to four decimal places.

| Meter (EUR price / USD price) | Implied EUR per USD |
|---|---:|
| ACR Basic Registry Unit (0.1431 / 0.1666) | 0.858944 |
| ACR Standard Registry Unit (0.5724 / 0.6666) | 0.858686 |
| ACR Data Stored (0.0859 / 0.1) | 0.859000 |
| Container Apps Standard Requests (0.3435 / 0.4) | 0.858750 |
| PostgreSQL Backup Storage LRS (0.0884 / 0.103) | 0.858252 |
| **Used below** | **0.8587** |

**preussen-bot** — 0.25 vCPU, 0.5 GiB, `minReplicas: 1`, North Europe. A 30-day month is
2,592,000 seconds.

```
vCPU:  0.25 x 2,592,000 =   648,000 vCPU-s
                          - 180,000 permanent monthly free grant
                          = 468,000 billable vCPU-s
RAM:    0.5 x 2,592,000 = 1,296,000 GiB-s
                          - 360,000 permanent monthly free grant
                          = 936,000 billable GiB-s
```

Container Apps bills an *active* and an *idle* per-second rate, and which one applies to
a worker with no ingress at all is not something this measurement can settle. Both bounds
are given rather than picking one and calling it a forecast:

| | vCPU | RAM | Total |
|---|---:|---:|---:|
| At the **active** rate (0.000024 USD/vCPU-s) | 9.64 | 2.41 | **12.06 EUR/month** |
| At the **idle** rate (0.000003 USD/vCPU-s) | 1.21 | 2.41 | **3.62 EUR/month** |

The free grant is per *subscription*, not per app — the apps left in Azure also draw on
it whenever they wake, so the bot's real share is at the pessimistic end.

| Line item | Arithmetic | EUR/month |
|---|---|---:|
| **nutrilens-pg** compute | `0.0171 EUR/h x 730 h` | 12.48 |
| **nutrilens-pg** storage | `0.1176 EUR/GB/month x 32 GB` | 3.76 |
| **nutrilens-pg total** | | **16.25** |
| **ACR Basic** | `0.1431 EUR/day x 30.4375` | 4.36 |
| **preussen-bot** | see above | 3.62 – 12.06 |
| netviz, dsai-containerapp, nutrilens, nutrilens-ai-server | `minReplicas: 0`, billed only while awake | ~0 |
| Storage accounts, Function App (Y1) | measured at or near 0.00 in Aug | ~0 |
| **Total** | | **24.22 – 32.66** |

**The single largest post-promotion line item is `nutrilens-pg` at ~16.25 EUR/month** —
more than half the forecast, and more than the VPS and the registry combined.

Cross-check that the method is sound: ACR Basic is derived at 4.36 EUR/month from the
retail price. Measured ACR spend was 4.92 (July) and 4.54 (August). The derivation lands
within ~10 % of two measured months, which is the reason to trust the same method applied
to the PostgreSQL and Container Apps lines.

### Unit prices used (all from prices.azure.com/api/retail/prices)

| Service | Meter | Region | Price | Unit |
|---|---|---|---:|---|
| Azure Container Apps | Standard vCPU Active Usage | northeurope | 0.000024 | USD / second |
| Azure Container Apps | Standard vCPU Idle Usage | northeurope | 0.000003 | USD / second |
| Azure Container Apps | Standard Memory Active Usage | northeurope | 0.000003 | USD / GiB-second |
| Azure Container Apps | Standard Memory Idle Usage | northeurope | 0.000003 | USD / GiB-second |
| Azure Database for PostgreSQL | B1MS vCore | westeurope | 0.0171 | EUR / hour |
| Azure Database for PostgreSQL | Storage Data Stored | westeurope | 0.1176 | EUR / GB / month |
| Container Registry | Basic Registry Unit | australiasoutheast | 0.1431 | EUR / day |
| Container Registry | Data Stored (overage) | australiasoutheast | 0.0859 | EUR / GB / month |

All five Container Apps environments were checked and are **Consumption**, not workload
profile. That matters: the `Environment Management Hour` meter is 0.1228 EUR/hour, which
across five environments would be ~448 EUR/month. It does not apply here. If an
environment is ever converted to a workload profile, that meter starts and this whole
forecast is void.

### Decision: nutrilens-pg is switched off before 2026-12-19

The owner confirmed on request that `nutrilens-pg` is **not in use — test only**. It is
the largest post-promotion line item (~16.25 EUR/month, measured SKU `Standard_B1ms`
Burstable, 32 GB, PostgreSQL 16, state `Ready`), so leaving it running past the promotion
would cost more than everything else on the subscription put together.

**Decision: stop the server, do not delete it, and keep it stopped for a 30-day recall
window before deleting.** Reasoning:

- A stopped Flexible Server stops billing compute (the 12.48 EUR half) while still
  billing storage (the 3.76 EUR half). Most of the saving arrives without any
  irreversible step.
- Deleting is irreversible and "test only" is a statement about intent, not a backup. If
  something turns out to have depended on it, a stopped server can be started; a deleted
  one cannot.
- Azure auto-starts a Flexible Server stopped for more than 7 days. So "stopped" is not a
  stable state on its own and the 30-day window needs a calendar reminder, not trust.

Not performed as part of this work — this records the decision and its reasoning only.

### Registry: measured input for the "do we still need ACR" question

Actual deduplicated registry usage (`az acr show-usage -n globalcr01`):

**8.5 GiB used of the 10 GiB included in Basic.** No storage overage is being paid today,
but there is only 1.5 GiB of headroom before the 0.0859 EUR/GB/month meter starts.

Per-repository, from `az acr manifest list-metadata`:

| Repository | Manifests | Sum of manifest sizes |
|---|---:|---:|
| nutrilens | 88 | 8,640 MiB |
| nutrilens-ai-server | 27 | 6,655 MiB |
| portfolio-webpage | 28 | 1,023 MiB |
| network-visualizer | 12 | 758 MiB |
| ml-visualizer | 3 | 708 MiB |
| preussen/web | 8 | 612 MiB |
| preussen/bot | 10 | 583 MiB |
| **Sum** | **176** | **18,981 MiB (18.5 GiB)** |

That 18.5 GiB sum is **not** the billed size and must not be quoted as one: manifests
share layers, and the deduplicated truth measured above is 8.5 GiB — the naive sum
double-counts by 2.2x.

The lever this points at is not the migration. `nutrilens` and `nutrilens-ai-server` are
115 of the 176 manifests and the bulk of the storage, and neither is being migrated.
Pruning old nutrilens tags is what buys registry headroom; moving preussen and portfolio
off Azure does not.

Deploy frequency, from `git log` on both repos:

| Repo | Measurement | Value |
|---|---|---|
| portfolio-webpage | release tags (release.yml deploys on tags) | 32 total; 29 of them in July 2026, 3 in May 2026 |
| Preussen-bot | pushes to `main` (deploy.yml runs on every one) | 7 in August 2026, 20 in the first 4 days of September 2026 |

Both are **bursty, not steady** — a "deploys per month" average would be a fiction. The
honest statement is that portfolio had one 29-release month and otherwise none, and that
preussen is in an active-development burst right now at ~5 deploys/day. Each preussen
deploy pushes four tags (bot and web, SHA and `latest`), so the current burst is the main
thing consuming the 1.5 GiB of remaining registry headroom.

`globalcr01` is in **australiasoutheast**. Every image pull from a German VPS crosses the
planet. This has no effect on the cost figures above (ACR Basic bills a flat daily unit
regardless of region) but it will affect deploy duration, and it is recorded here because
it is surprising and nobody would guess it.

### Recorded for completeness: Oracle Cloud Always Free

Oracle Cloud's Always Free tier provides 4 ARM (Ampere A1) cores and 24 GB of RAM at
**0 EUR permanently**, with no promotional end date. On paper that is both cheaper than
the Contabo VPS (6.50 EUR/month) and roughly three times the RAM.

Stated as a fact so it is on the record, with **no recommendation attached**: the Contabo
VPS is already paid for, and this repository already contains a complete, never-activated
Oracle deployment stack (`docs/DEPLOYMENT_ORACLE_0EUR.md`, commit `79219ee`) that was
built and then not used.

## Budget and cost alert

A Cost Management budget exists on the subscription:

| | |
|---|---|
| Name | `monthly-subscription-guard` |
| Amount | 15 EUR |
| Time grain | Monthly |
| Period | 2026-09-01 → **2028-01-01** |
| Notifications | Actual > 50 %, Actual > 80 %, Actual > 100 %, **Forecasted > 100 %** |
| Contact | koflerphillip@outlook.com |
| Action groups / contact roles | **none — notification only** |

### Why 15 EUR and not some other number

A budget amount without its reasoning gets "corrected" by the next person who looks at it,
so the reasoning is written down:

- Today's extrapolated run rate is 3.79 EUR/month and August's measured actual was
  15.91 EUR. 15 EUR sits just above the second of those.
- The post-promotion forecast is 24–33 EUR/month.
- So 15 EUR is a threshold that a quiet month cannot reach by accident, but that the
  promotion expiry on **2026-12-19** will trip immediately and unmistakably.

If `nutrilens-pg` is switched off as decided above, the post-promotion forecast drops to
roughly 8 EUR/month and this amount should be revisited downwards — a budget that can
never fire is decoration.

### Why a forecast alert as well as actual alerts

The three Actual thresholds confirm that money has already been spent. Only the
**Forecasted > 100 %** alert fires *before* it is gone, by projecting the month's trend.
On a subscription with `spendingLimit: "Off"` that is the one that matters.

### Why it only notifies

The budget deliberately has **no action group** attached, and none should be added that
stops, deallocates or deletes anything. An automated shutdown on a cost threshold would
take the Discord bot and the public sites offline at the worst possible moment — a cost
alert is information, not an incident response.

### How it was created

`az consumption budget create` **cannot** do this. The command exists, but it accepts only
`--amount`, `--category`, `--time-grain`, the dates and resource filters: it has no
argument for notifications at all, so it cannot express thresholds, contact emails, or the
`Forecasted` threshold type. It was therefore created with the REST API directly:

```sh
az rest --method put \
  --url "https://management.azure.com/subscriptions/5698eb78-1994-4a3e-b97a-b3bcd04df87f/providers/Microsoft.Consumption/budgets/monthly-subscription-guard?api-version=2023-05-01" \
  --headers "Content-Type=application/json" \
  --body @budget.json
```

Verify with:

```sh
az consumption budget list --query "[].{name:name,amount:amount,grain:timeGrain,end:timePeriod.endDate,notif:keys(notifications)}" -o json
```

Note that the API lower-cases the notification keys on read
(`actual_GreaterThan_50_Percent`), which is cosmetic and not a failed write.

## Open gaps

Recorded as gaps rather than filled with estimates:

- **September 2026 will not be known until the month closes.** Everything about whether
  the migration saves money *today* hangs on this one number. Re-run the Cost Management
  query with `timeframe: "Custom"`, `timePeriod` 2026-09-01 → 2026-09-30 after
  2026-10-01.
- **Whether preussen-bot bills at the active or the idle Container Apps rate** is not
  resolved. The forecast carries both bounds (3.62 – 12.06 EUR/month) instead of picking
  one.
- **`caddy` and `azurite` memory limits in `application/docker-compose.prod.yaml` are
  budget allocations, not measurements.** Nothing has run on the VPS yet. Replace them
  with a week of `docker stats` after the cutover.
- **Backup storage for `nutrilens-pg`** is assumed to sit inside the included allowance
  (backup up to 100 % of provisioned storage is free). It was not separately measured;
  it measured 0.00 EUR in August, which is consistent but is not a direct confirmation.

## Fixed in passing: the admin password hash was being truncated

Found while rendering `application/docker-compose.prod.yaml` for the capacity work, not
looked for. Recorded because it would have followed the migration onto the VPS.

`ADMIN_PASSWORD_HASH` in `application/.env` held a raw bcrypt hash, which has the shape
`$2b$12$<22 chars salt><31 chars digest>`. Compose interpolates `${ADMIN_PASSWORD_HASH}`
from that file, and during interpolation it treats `$acKdU...` — the start of the salt —
as a variable reference. That variable does not exist, so Compose substituted an empty
string and emitted only a warning:

```
warning: The "acKdU" variable is not set. Defaulting to a blank string.
```

Measured, without printing the value: the hash in `.env` is 60 characters (every bcrypt
hash is), and the value Compose delivered to the container was **54**. Six characters
were silently deleted. Admin login could not have succeeded against that container, and
the failure mode is a warning line in `docker compose config` that nobody reads.

Both `docker-compose.yaml` and `docker-compose.prod.yaml` interpolate the variable the
same way, so this affected the local stack as well as the deploy.

**Fix:** the literal `$` characters in that one `.env` line are now escaped as `$$`,
which is Compose's documented escape and which it un-escapes back to a single `$` at
interpolation time. Verified end to end: the delivered value is now 60 characters and
compares byte-identical to the original, and both compose files render with zero
interpolation warnings.

No other consumer of that file exists to break — there is no `dotenv` import, no
`--env-file` flag in any `package.json` script, and no `source .env` in `scripts/`. The
two compose files are the only readers.

`.env` remains untracked and gitignored (`.gitignore:17`); nothing secret was copied,
logged or committed.

## Container runtime

Docker Engine 29.8.0 + Compose plugin v5.5.1 from the official
`download.docker.com/linux/ubuntu` apt repo (not Ubuntu's `docker.io`, which lags and
ships no compose plugin), plus `restic` 0.16.4 from Ubuntu for the later backup task.
`docker compose version` runs as `deploy` without sudo — `deploy` was already in the
`docker` group from the hardening pass.

The VPS never builds images. GitHub Actions builds and pushes; the box only pulls.

### `/etc/docker/daemon.json`

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "ip": "127.0.0.1"
}
```

Written before the daemon's first start, so it never ran once with uncapped logs.
30 MB per container is the ceiling; an uncapped json-file log fills the 100 GB disk
and takes the whole box down, slowly enough that nobody connects the two.

### Docker vs ufw — one mechanism, measured

Docker writes its own NAT/filter rules and a published port bypasses ufw entirely.
This was verified on the box rather than assumed. Two throwaway containers, then a
scan from off-box:

| Publish spec        | Host listener      | Reachable from the internet |
| ------------------- | ------------------ | --------------------------- |
| `-p 9998:80`        | `127.0.0.1:9998`   | no                          |
| `-p 0.0.0.0:9999:80`| `0.0.0.0:9999`     | **yes** — ufw denies 9999   |

`ufw status` claimed both were blocked. It was wrong about the second one.

The chosen mechanism is the `"ip": "127.0.0.1"` line above: it makes loopback the
default bind address for any published port, so a bare `"8080:8080"` in a compose file
cannot reach the internet. Reaching the internet then requires writing `0.0.0.0:`
explicitly — a deliberate, reviewable act in the compose file rather than an accident.

**Consequence for the compose files:** Caddy is the one service that must be public,
so it has to publish explicitly:

```yaml
ports:
  - "0.0.0.0:80:80"
  - "0.0.0.0:443:443"
  - "0.0.0.0:443:443/udp"
```

A bare `"80:80"` will bind loopback only and the site will be unreachable from outside
while `docker ps` looks perfectly healthy.

Rejected alternatives: `"iptables": false` kills container egress unless the NAT rules
are hand-written, and a `DOCKER-USER` allow-list would be a second copy of ufw's port
policy — two owners of "which ports are public" is how these drift apart.

### One unit per stack

`/etc/systemd/system/portfolio.service` and `/etc/systemd/system/preussen.service`,
both enabled, modelled on `DEPLOYMENT_ORACLE_0EUR.md` §10:

| | |
|---|---|
| Type | `oneshot` + `RemainAfterExit=yes` |
| Order | `Requires=docker.service`, `After=docker.service network-online.target` |
| Runs as | `User=deploy` |
| Portfolio | `/opt/portfolio`, `docker-compose.prod.yaml` |
| Preussen | `/opt/preussen`, `docker-compose.prod.yml` |

`User=deploy` matters: the CI deploy does its `docker login` as `deploy`, so the
credentials land in `/home/deploy/.docker/config.json`. A unit running as root would
have its own empty credential store and a cold-start pull would fail `unauthorized`
while the same pull by hand succeeded.

**One owner per job.** The systemd unit is the only thing that starts or stops a
*stack* — that is what an operator drives, and `systemctl stop` runs `compose down`.
`restart: unless-stopped` in the compose files is the container-level supervisor for a
crashed process, not a second stack owner. It must not be `restart: always`: `always`
resurrects containers after `systemctl stop`, and that would be the second owner.

**The compose files are not on the box yet.** Each unit carries
`ConditionPathExists=` on its compose file, so until the deploy pipeline delivers one
the unit is *skipped*, not failed — journal says "was skipped because of an unmet
condition check", `Result=success`. A unit that goes red on every boot is a unit
nobody reads by the third boot. Once a stack is really deployed, `systemctl status`
must show `active (exited)`; still seeing the skip line means the compose file landed
somewhere other than the path above.

### Automatic reboot: enabled

`/etc/apt/apt.conf.d/52-autoreboot.conf` (a drop-in, so apt never prompts about a
modified `50unattended-upgrades`):

```
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:30";
Unattended-Upgrade::Automatic-Reboot-WithUsers "false";
```

The condition the hardening pass left this open on is now met — both stacks return on
boot. Kernel and libc fixes only take effect after a reboot, so leaving it off turns
unattended-upgrades into theatre. `WithUsers "false"` never reboots under an active
session; the cost is that a forgotten SSH login defers it to the next run, so if
uptime keeps climbing past a kernel update, read `/var/log/unattended-upgrades/`.

Docker's own repo is not in `Allowed-Origins`, so `docker-ce` is not upgraded
unattended — a daemon restart mid-night would bounce every container.

### Verified after a real reboot

Boot ordering from the journal: `docker.service` Started 18:45:32.657, both stack
units evaluated 18:45:32.658 — Docker is up first.

Also after the reboot: ufw active with exactly the four rules; `sshd -T` still reports
`permitrootlogin no` / `passwordauthentication no`; password and root logins both
rejected with `Permission denied (publickey)`; fail2ban active. An external scan of
22/80/443/2375/2376/9998/9999 finds **only 22** open — the Docker API is not exposed
and nothing survived the port test.

## First real deploy: portfolio, preussen-web, preussen-bot (2026-09-04)

Both stacks brought up on the VPS for the first time, DNS still on Azure. Three real
defects found and fixed during this pass, not caught by any earlier plan:

**`portfolio-web`/`portfolio-jobs` never existed in the registry.** The compose file
(and this doc, above) assumed two images. `az acr repository list --name globalcr01`
shows exactly one portfolio repo, `portfolio-webpage`, and the live `portfolio-app`
Container App runs `portfolio-webpage:v6.3.4` — a single combined image. There is no
`portfolio-jobs` image anywhere; Azure's equivalent (`woofi-monitor-checker`) is a
native `functionapp,linux` resource (`linuxFxVersion: Node|22`), not a container, so
one was never built. Fixed the `web` image reference to `portfolio-webpage`; disabled
`jobs` via `profiles: ['jobs']` (not deleted — it starts the moment a real image is
pushed and this key is removed).

**Bare-hostname Caddy site blocks default to :443, even with `auto_https off`.**
`auto_https off` disables certificate issuance and the automatic HTTP→HTTPS redirect,
but does not move a site's listener to :80. Confirmed with `caddy adapt`: a bare
`example.com { }` block still gets `"listen": [":443"]`. The result on the box was a
TCP RST on every connection (nothing inside Caddy bound to :80, despite `docker ps`
and `ss` both looking healthy — docker-proxy holds the host port regardless of whether
anything listens behind it). Fix: prefix every pre-cutover site address with
`http://` (`http://woofi-developments.at { }`), which pins the listener to :80. This
turns the post-cutover manual step into two edits, not one — delete `auto_https off`
*and* strip the `http://` prefixes — both are called out together at the top of the
Caddyfile now.

**A service literally named `web` in two different compose projects collides on a
shared network.** Compose registers a service's own name as a network alias on
*every* network it joins, in addition to any custom `aliases:` — this is separate
from, and not overridden by, a custom alias. With preussen's dashboard service still
named `web`, joining `edge-net` made it resolvable there as `web` too — the exact
name portfolio's own Caddy block already used for its own container on
`portfolio-net`. Caddy sits on both networks; its resolver picked the `edge-net`
entry, so every portfolio hostname (`woofi-developments.at`, `www.`, `status.`) was
silently reverse-proxied to the preussen dashboard instead. All four hostnames
returned clean 2xx/3xx status codes throughout — this was only caught by checking the
actual `<title>` in the response body, not by status codes. Fixed by renaming
preussen's service key from `web` to `dashboard`; the explicit `preussen-web` alias
(what Caddy actually targets) was never the problem and is unchanged.

**Bot ordering, live incident.** `systemctl start preussen` runs `docker compose up
-d` unconditionally, which brought `bot` up immediately — before Azure's
`preussen-bot` (min-replicas 1 at the time) had been scaled down. Measured via
`docker logs`/`docker inspect`: the VPS bot reached `bot-ready` and held a live
Discord gateway connection from 21:22:39Z to 21:23:39Z while Azure's replica was
simultaneously active — a real ~60s double-gateway window in the live ~1500-member
server, caught and stopped by hand, not prevented in advance. Added `profiles: ['bot']`
to the `bot` service as a standing safety gate: `systemctl start preussen` now only
brings up `dashboard`. Bringing the bot up requires the explicit two-step sequence —
scale Azure to 0, confirm 0 replicas via `az containerapp replica list`, then
`COMPOSE_PROFILES=bot docker compose -f docker-compose.prod.yml up -d bot` — spelled
out in the comment on that service.

**OOM-kill/restart test, actually run, not asserted.** Overran `azurite`'s 256m limit
from inside its own PID 1 (a temporary `command:` override; azurite has no active
consumer while `jobs` stays disabled, so this was a safe target) rather than via
`docker exec`, which only kills a side process and leaves PID 1 — and therefore
`restart: unless-stopped` — untouched. With PID 1 itself as the victim: `OOMKilled:
true`, `RestartCount` climbed from 0 to 5 in a crash loop (each restart re-hit the
same command, hence 5 rather than 1) before the command override was reverted and the
container force-recreated back to its real entrypoint. Confirms the mechanism works
for a process that actually leaks; a healthcheck marking a container `unhealthy`, or a
hung process that never exits, is *not* covered by `restart: unless-stopped` — that
policy only fires on PID 1 actually exiting.
