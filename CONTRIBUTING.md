# Contributing

## The layout

Everything that runs lives under `application/`, which is an npm workspace:

```txt
application/
├─ package.json          workspace root — tooling only, no application code
├─ dockerfile            builds the server image (with the client bundle inside)
├─ docker-compose.yaml   the local stack
├─ scripts/              repo tooling (version sync)
├─ server/               Express + Mongoose — the API, and it serves client/dist
├─ client/               React + Vite + Tailwind
└─ jobs/                 Azure Functions (timer triggers)
```

Three deployables, three `package.json` files:

- **server** and **client** are one npm workspace. One `npm install` at
  `application/` installs both, and their dependencies are hoisted into a single
  `node_modules`.
- **jobs** deliberately sits _outside_ the workspace. The Azure Functions deploy
  zips that folder including its `node_modules`, so a hoisted install would hand
  Azure a package with no dependencies in it. It therefore keeps its own lockfile
  and is installed on its own.

## Getting it running

```bash
cd application
npm install            # server + client
npm ci --prefix jobs   # the Azure Functions package

cp .env.example .env   # then fill it in — see the comments in the file

docker compose up      # mongodb (+ azurite, jobs and web under the production profile)
npm run dev            # the client, with /api proxied to localhost:8080
npm start              # the server
```

## Before you open a PR

```bash
npm run lint           # every package
npm run format         # prettier, every package
npm test               # server tests
```

CI enforces both: unformatted code fails the `Format` job, and lint errors fail
the `Lint` job. Formatting is not a matter of taste here — run the formatter and
move on.

## Style

Prettier owns formatting; there is nothing to argue about. Each package has its
own `.prettierrc.json` (single quotes, 4 spaces, 100 columns, trailing commas).
The client additionally sorts Tailwind classes via the official plugin.

Comments should say _why_, not _what_. If a line needs a comment to explain what
it does, rewrite the line instead.

## Versions

The git tag is the single source of truth. Publishing a release stamps its version
into every `package.json` automatically (`.github/workflows/release.yml` runs
`npm run version:sync`). Do not bump versions by hand.

## Commits

Conventional-ish prefixes, because the changelog and the release notes read better
that way:

```txt
feat: add the services page
fix: stop the boot screen from hiding under the top bar
chore(deps): bump vite to 8.0.14
docs: explain why jobs is not in the workspace
```

## Security

Never commit `.env`, tokens or connection strings. If you find a vulnerability, do
not open a public issue — follow [SECURITY.md](SECURITY.md).
