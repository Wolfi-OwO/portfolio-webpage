# Deployment Guide: 0€ Hosting on Oracle Cloud Always Free

This guide moves the portfolio-webpage stack from Azure Container Apps (no
longer free) to a single Oracle Cloud Always Free VM running Docker Compose.
Caddy terminates TLS at the edge, the app and the Azure Functions jobs run as
containers, and the images are pulled from the existing private Azure
Container Registry (ACR) — no public image, no port 8080 exposed, no extra
hosting bill.

```
                                    ┌──────────────────────────────┐
                                    │  Oracle Cloud Always Free VM │
  browser ──HTTPS/443 ──► ┌──────┐  │ ┌────────┐      ┌────────┐  │
                          │Caddy │──►│  web   │      │ jobs   │  │
                          │ 80   │   │ :8080  │      │ (func) │  │
                          │ 443  │   └────▲───┘      └───▲────┘  │
                          └──┬───┘        │             │       │
                             │            └──────┬──────┘       │
                       Docker bridge   ┌─────────┴─────────┐    │
                       (private net)   │     azurite       │    │
                                       │  queues/tables    │    │
                                       └───────────────────┘    │
                                            │    ▲              │
                                            └────┘              │
                             MongoDB Atlas                 (internet)
                             (external, unchanged)
```

- **Caddy** is the only service with host ports: 80 / 443 / 443-udp. It issues
  and renews Let's Encrypt certificates automatically and reverse-proxies to
  the `web` container over the compose network.
- **web** is the Express server (SPA + API), not published to the host.
- **jobs** is the Azure Functions runtime (timer triggers: status checker,
  contribution sync), the same image/entrypoint as the Function App in Azure.
- **azurite** emulates an Azure Storage account on the private network so the
  Functions host has an `AzureWebJobsStorage` for timer state. No host ports.
- **MongoDB stays on Atlas** — running a database on this VM would eat the
  whole free-tier CPU/RAM budget.

---

## 1. Create the VM

1. Sign in to the Oracle Cloud Console → **Instances** → **Create Instance**.
2. Name it e.g. `portfolio`; use the **Ampere A1 (ARM)** shape — up to
   **4 OCPU / 24 GB RAM** on Always Free. The x86 `VM.Standard.E2.1.Micro`
   (1 OCPU / 1 GB) qualifies too but is too small for web + jobs + caddy
   together; use it only if the app is moved elsewhere.
3. The boot volume is free up to 200 GB. Set the image to **Oracle Linux 8**,
   **Ubuntu 22.04** or **Debian 12** (the docker install commands below cover
   all three).
4. Upload a public SSH key or paste it in the _SSH keys_ box.
5. Assign a **public IP** and note it down.

## 2. Open the firewall / security list

The internet only sees the ports Caddy uses. In the VCN for the instance,
edit the **Default Security List** (or an instance-specific NSG) and add
ingress rules:

| Source      | Protocol | Port | Purpose                             |
| ----------- | -------- | ---- | ----------------------------------- |
| `0.0.0.0/0` | TCP      | 80   | HTTP redirect + HTTP ACME challenge |
| `0.0.0.0/0` | TCP      | 443  | HTTPS                               |
| `0.0.0.0/0` | UDP      | 443  | HTTP/3 (QUIC)                       |

Do **not** open 8080, 10000, 27017 or anything else. If you keep the VM's
default OS firewall (`ufw` on Ubuntu), mirror the same rules there:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
```

## 3. Point the DNS

Create an A record for the domain you will put next in `DOMAIN`
(whatever you bought — for example `phillip-kofler.at`):

| Name  | Type | Value         |
| ----- | ---- | ------------- |
| `@`   | A    | `<public IP>` |
| `www` | A    | `<public IP>` |

The HTTPS cert provisioning needs a domain that resolves to the VM **before**
the first request. From the console, run `dig +short <domain>` — it must show
the VM's IP before you start caddy.

## 4. Install Docker and Docker Compose

Docker with Compose v2 plugins, everything on one VM:

**Ubuntu / Debian:**

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
```

**Oracle Linux 8:**

```bash
sudo dnf install -y dnf-utils
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

Log out and back in so the `docker` group applies. Verify:

```bash
docker --version
docker compose version
```

## 5. The private ACR — build once, pull everywhere

The VM does **not** build images. The deploy pipeline builds and pushes the
two images (`portfolio-web`, `portfolio-jobs`) to your private ACR; the VM
only pulls. On initialization, verify the VM's access:

```bash
docker login portfolioacr.azurecr.io -u <APP_ID> -p <SP_PASSWORD>
```

The login is only needed at pull-time and is cached in `~/.docker/config.json`
(after a reboot / new SSH session you may have to re-login — if the pull gets
`unauthorized`, start here).

### 5.1 Create a scoped Service Principal for pull

Give the VM a pull-only identity, not your admin password:

```bash
# Using your Azure login
az login
az acr sp create \
  --registry portfolioacr \
  --name portfolio-vm-pull \
  --role AcrPull
```

Jot down the `appId` and the `password` — these go into ACR_USERNAME /
ACR_PASSWORD in `application/.env` on the VM.

If you also want the pipeline (GitHub Actions) to build + push, create a
second SP (or a scoped token) with the `AcrPush` role on the registry; the
deploy section below covers that flow.

## 6. Prepare the VM

The stack lives at `/opt/portfolio-webpage` — root-owned, so SSH users can
read the compose stack but not edit its configuration:

```bash
sudo mkdir -p /opt/portfolio-webpage
sudo chown $USER:docker /opt/portfolio-webpage
cd /opt/portfolio-webpage

# Create the application directory
git clone https://github.com/Wolfi-OwO/portfolio-webpage.git .

# Copy the sample env and fill it in (see §7)
cp application/.env.example application/.env
chmod 600 application/.env
```

## 7. Fill the production `.env`

Edit `application/.env` — the variables are documented in
`application/.env.example`. For this VM the decisive ones:

```bash
DOMAIN=phillip-kofler.at
ACR_SERVER=portfolioacr.azurecr.io
ACR_USERNAME=<pull SP appId>
ACR_PASSWORD=<pull SP password>
MONGODB_PASSWORD=<your Atlas password>
JWT_SECRET=<long random base64>
ADMIN_USER=...
ADMIN_PASSWORD_HASH=<bcrypt>
AZURE_SUBSCRIPTION_ID=...
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
GITHUB_TOKEN=...
GITLAB_TOKEN=...
```

Set a file mode that keeps the secrets to the operator:

```bash
chmod 600 application/.env
```

## 8. First start

```bash
cd /opt/portfolio-webpage/application
docker compose -f docker-compose.prod.yaml up -d
docker compose -f docker-compose.prod.yaml ps
```

The first `curl https://<domain>` takes a few seconds (Caddy triggers the
ACME handshake on the first request). Then:

```bash
curl -sI https://phillip-kofler.at | head -20
```

Expect `HTTP/2 200`, an `alt-svc` header (HTTP/3) and a swarm of `Strict-Transport-Security`,
`Content-Security-Policy` etc. headers. `docker compose logs caddy` shows the
access log and, on the first start, the ACME call.

## 9. Deployments

### 9.1 Build & push the images to the private ACR

The VM is ARM64 (Ampere); GitHub-hosted runners are x86_64 — so the pipeline
must build a multi-arch manifest. As the deploy section below details, the two
images are pushed to ACR as:

```
portfolioacr.azurecr.io/portfolio-web:latest
portfolioacr.azurecr.io/portfolio-jobs:latest
```

Anything a compose pulls must resolve to exactly `portfolio-web:latest` etc.
Given the image names above, set `IMAGE_TAG=latest` in the VM's `.env`.

### 9.2 Trigger the deploy (SSH)

The release flow ends with an SSH jump onto the VM that pulls and re-creates
the changed containers:

```bash
ssh deploy@<vm-ip>
cd /opt/portfolio-webpage/application
docker login portfolioacr.azurecr.io -u $ACR_USERNAME -p $ACR_PASSWORD
docker compose -f docker-compose.prod.yaml pull
docker compose -f docker-compose.prod.yaml up -d
exit
```

This is automated: `.github/workflows/release.yml` runs exactly these steps
(`docker login` → `pull` → `up -d --remove-orphans`) over SSH as its final job
whenever a GitHub Release is published, pinned to the tag that job's own build
just pushed rather than to whatever `IMAGE_TAG` sits in the VM's `.env`. See
§14 for the secrets that job needs and how to provision them.

### How it stays up

- `restart: unless-stopped` on every service — the containers come back if
  the process dies or the VM reboots, unless you have _deliberately stopped_
  them with `docker stop`.
- Add a `portfolio.service` systemd unit (section 10) so that after a full
  VM reboot, docker's own startup is not racing with the stack: the unit
  pulls a defined order (`network-online.target` → docker → compose).

## 10. Auto-restart after a reboot

Create `/etc/systemd/system/portfolio.service`:

```ini
[Unit]
Description=Portfolio stack (docker compose, Oracle Always Free VM)
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/portfolio-webpage/application
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yaml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yaml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio.service
sudo systemctl status portfolio.service
```

`ExecStart=… up -d` returns immediately after containers are created, so
`Type=oneshot` + `RemainAfterExit=yes` is the correct pattern — the unit
stays "active" and `systemctl stop portfolio` cleanly does `compose down`.

## 11. Zero-downtime rolling updates

True zero-downtime on a single VM requires more than one web replica and a
load balancer — Caddy alone against one `web` container. On this stack the
cheapest correct answer is: **the blip is a container restart, about two
seconds**, and for a personal portfolio that is acceptable.

```
1. docker compose -f docker-compose.prod.yaml pull
2. docker compose -f docker-compose.prod.yaml up -d web
```

If you want the gap to go away, run the service as two replicas installs a
second front:

```bash
# caddy points at the `web` service name; with 2 replicas Docker load-balances
docker compose -f docker-compose.prod.yaml up -d --scale web=2 --no-deps web
```

(Compose recreates one container, waits, recreates the other — Caddy serves
the still-running replica in between.) To roll back:

```bash
cd /opt/portfolio-webpage/application
# pin the previously-working tag; the image is still in the VM's local cache
docker compose up -d web  # IMAGE_TAG=old-tag in .env
```

With `IMAGE_TAG` pinned to the old tag, compose recreates `web` from the cached
image — no network pull needed.

## 12. Certificate renewal

Caddy renews automatically (90-day certs, refreshed at 60). The renewal uses
files in the `caddy_data` named volume — that volume itself lives at
`/var/lib/docker/volumes` on the VM. Back up the **content of caddy_data**
before you destroy the VM or else you get a new identity and hit the twice-a-
week ACME rate limit.

## 13. Where the money goes

This stack at the free tier:

| Resource                 | Free tier                        |
| ------------------------ | -------------------------------- |
| Ampere A1 4 OCPU / 24 GB | 4 OCPU + 24 GB total (max 4 VMs) |
| Boot volume 200 GB       | included                         |
| Outbound transfer        | 10 TB / month included           |

Everything else you already pay for (Atlas, ACR) you are already running — the
VM replaces the bills for the Azure Container Apps SKU. The Azure Container
App itself is retired: `release.yml` no longer deploys to it, and it should be
deleted once you're satisfied the VM is stable (it costs nothing while scaled
to zero, but it is also a second copy of the app nobody is looking at).

The `woofi-monitor-checker` Azure Function App is **not** deleted — the VM's
`jobs` container now runs the same timers against the same database, so the
Function App is redundant for normal operation, but it is kept as a
break-glass fallback. `.github/workflows/deploy-monitor-checker.yml` only
runs on `workflow_dispatch` now; it no longer auto-deploys on every push to
`application/jobs/**`, because two live copies of the same timer running
against the same database is exactly the kind of duplicate-owner bug this
stack has hit before elsewhere (see §13's "one owner per job" reasoning).

## 14. GitHub secrets for the release pipeline

`release.yml` needs these, all set at the repository (or `production`
environment) level in GitHub. Values marked "already existed" predate this
document — they're listed for completeness because they now feed a second
job (`push-jobs-image`) in addition to `push-image`.

| Secret                | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `ACR_PUSH_USERNAME`    | `AcrPush`-role SP appId — pushes both images to ACR (already existed) |
| `ACR_PUSH_PASSWORD`    | `AcrPush`-role SP password (already existed)          |
| `ACR_PULL_USERNAME`    | The §5.1 `AcrPull`-role SP appId — used by the deploy job to `docker login` on the VM, over SSH, on your behalf. Deliberately a *different* credential from `ACR_PUSH_*`: the deploy job only ever needs to pull |
| `ACR_PULL_PASSWORD`    | The §5.1 SP password |
| `ORACLE_VM_HOST`       | The VM's public IP or DNS name |
| `ORACLE_VM_USER`       | SSH user on the VM (the one that owns `/opt/portfolio-webpage`, per §6) |
| `ORACLE_VM_SSH_KEY`    | Private key for that user, OpenSSH format, no passphrase (a passphrase can't be entered non-interactively in a runner) |
| `ORACLE_VM_KNOWN_HOSTS`| The VM's host key, in `known_hosts` format — see below |

Repository *variable* (`vars.*`, not a secret — it's not sensitive) already
in use: `ACR_NAME` (`portfolioacr`), `IMAGE_NAME` (`portfolio-web`).

### Getting `ORACLE_VM_KNOWN_HOSTS` safely

The whole point of pinning this is that the runner must not trust whatever
key answers when it connects — so don't generate the secret *from* that
connection. Capture the key once, from the VM itself, and verify it out of
band (the fingerprint the VM reports on first SSH login, or `ssh-keygen -lf
/etc/ssh/ssh_host_ed25519_key.pub` run over your existing, already-trusted SSH
session):

```bash
# on your own machine, once — NOT inside the pipeline
ssh-keyscan -t ed25519 <vm-ip-or-host> > known_hosts.txt
cat known_hosts.txt   # compare the fingerprint against the VM's own record before trusting it
```

Paste the resulting line(s) into `ORACLE_VM_KNOWN_HOSTS` as-is. If the VM is
ever rebuilt (new host key), this secret has to be refreshed the same way —
that's the cost of pinning instead of trusting on first connect, and it's the
correct trade for a credential that runs on a public runner.

---

**Files that ship this stack:** `application/docker-compose.prod.yaml`,
`application/Caddyfile`, `application/.env.example` (documentation of every
variable), `.github/workflows/release.yml` (build + push + deploy),
`.github/workflows/deploy-monitor-checker.yml` (manual fallback only), this
document.
