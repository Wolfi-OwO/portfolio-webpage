#!/usr/bin/env node
/**
 * Writes one version into every package.json of the workspace.
 *
 * The git tag is the single source of truth — it already drives the Docker image
 * tag and the `APP_VERSION` the footer shows, so having the package.json files
 * drift away from it just creates a second, wrong answer to "which version is
 * this?". Rather than bumping three files by hand (and forgetting one), this
 * derives the version from the tag and stamps it everywhere.
 *
 * Usage:
 *   node scripts/sync-version.mjs            # from the current git tag
 *   node scripts/sync-version.mjs 1.4.0      # explicit
 *   node scripts/sync-version.mjs --check    # verify only, exit 1 on drift (CI)
 *
 * In CI, GITHUB_REF_NAME carries the tag that triggered the release.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Kept in step with the `workspaces` array in package.json.
const PACKAGES = ['server', 'client', 'jobs'];

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function fromGit() {
    // In a tag-triggered workflow the ref *is* the tag; locally, ask git.
    const ref = process.env.GITHUB_REF_NAME;
    if (ref && ref !== 'main') return ref;

    try {
        return execFileSync('git', ['describe', '--tags', '--abbrev=0'], {
            cwd: ROOT,
            encoding: 'utf8',
        }).trim();
    } catch {
        return '';
    }
}

/** `v1.4.0` and `1.4.0` are the same release; package.json only accepts the latter. */
function normalise(raw) {
    return raw.replace(/^v/, '').trim();
}

function packageFile(pkg) {
    return join(ROOT, pkg, 'package.json');
}

function readVersion(pkg) {
    return JSON.parse(readFileSync(packageFile(pkg), 'utf8')).version;
}

function writeVersion(pkg, version) {
    const file = packageFile(pkg);
    const raw = readFileSync(file, 'utf8');

    // A targeted replace, not a re-serialise: JSON.stringify would reorder nothing
    // but would happily reformat the whole file and fight with Prettier.
    const next = raw.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`);

    if (next === raw) {
        throw new Error(`No "version" field found in ${file}`);
    }

    writeFileSync(file, next);
}

const args = process.argv.slice(2);
const check = args.includes('--check');
const explicit = args.find((arg) => !arg.startsWith('--'));

const version = normalise(explicit || fromGit());

if (!version) {
    console.error('No version given and no git tag found. Pass one: sync-version.mjs 1.4.0');
    process.exit(1);
}

if (!SEMVER.test(version)) {
    console.error(`Not a semver version: "${version}"`);
    process.exit(1);
}

if (check) {
    const drifted = PACKAGES.filter((pkg) => readVersion(pkg) !== version);

    if (drifted.length) {
        console.error(`Version drift — expected ${version}:`);
        for (const pkg of drifted) {
            console.error(`  ${pkg}/package.json is ${readVersion(pkg)}`);
        }
        process.exit(1);
    }

    console.log(`All packages are at ${version}.`);
    process.exit(0);
}

for (const pkg of PACKAGES) {
    const before = readVersion(pkg);
    writeVersion(pkg, version);
    console.log(`${pkg === '.' ? 'workspace' : pkg}: ${before} → ${version}`);
}

// The lockfiles carry the version too; leaving them stale makes `npm ci` fail with
// "lock file does not satisfy package.json". Two calls, because `jobs` is not part
// of the workspace and therefore has a lockfile of its own.
const quiet = ['--silent', '--no-audit', '--no-fund'];

execFileSync(
    'npm',
    ['install', '--package-lock-only', '--workspaces', '--include-workspace-root', ...quiet],
    { cwd: ROOT, stdio: 'inherit' },
);

execFileSync('npm', ['install', '--package-lock-only', '--prefix', 'jobs', ...quiet], {
    cwd: ROOT,
    stdio: 'inherit',
});

console.log(`All packages synced to ${version}.`);
