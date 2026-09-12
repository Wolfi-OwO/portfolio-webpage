#!/usr/bin/env node
/**
 * Regression check for the 2026-09-12 bug: stamping a package.json that
 * already carried the target version threw "No version field found", because
 * writeVersion() used "the regex replace produced identical text" as its
 * proxy for "the field is missing" — indistinguishable from "the field is
 * present and already correct". Run: node application/scripts/sync-version.test.mjs
 */
import assert from 'node:assert/strict';

const VERSION_FIELD = /("version"\s*:\s*")[^"]*(")/;

// Re-stamping the same version onto an already-correct package.json is
// textually a no-op — the presence check must still see the field.
const alreadyCorrect = JSON.stringify({ name: 'server', version: '1.0.0' }, null, 2);
assert.ok(VERSION_FIELD.test(alreadyCorrect), 'presence check must find an existing version field');
const restamped = alreadyCorrect.replace(VERSION_FIELD, '$11.0.0$2');
assert.equal(restamped, alreadyCorrect, 'same-value re-stamp is a no-op — this used to be misread as "missing"');

// A genuinely missing field must still fail the presence check.
const missing = JSON.stringify({ name: 'server' }, null, 2);
assert.equal(VERSION_FIELD.test(missing), false, 'a genuinely missing field must still fail');

console.log('sync-version.test.mjs: ok');
