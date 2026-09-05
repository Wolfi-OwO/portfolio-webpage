import test from 'node:test';
import assert from 'node:assert/strict';

// resolveCheckMode is the one branch deciding whether a monitor's health is
// read from Azure's control plane, from a plain HTTP GET, or from nothing at
// all — a wrong branch here either wakes a scale-to-zero app (money) or
// fabricates a status for something never actually checked (dishonest
// status page). Run with: node --test --env-file=... (no framework, no DB —
// pure function, no ensureConnected() needed).
process.env.CONTAINER_APP_RESOURCE_GROUPS = 'netviz-rg,dsai-5bhif-app,nutrilens-rg';
const { resolveCheckMode } = await import('./checkMonitors.js');

test('ARM-managed resource group -> arm, regardless of url', () => {
    assert.equal(
        resolveCheckMode({ containerApp: { resourceGroup: 'netviz-rg', name: 'netviz' } }),
        'arm',
    );
});

test('containerApp present but resourceGroup left the allowlist -> falls back to its url', () => {
    assert.equal(
        resolveCheckMode({
            containerApp: { resourceGroup: 'portfolio-webpage-rg', name: 'portfolio-app' },
            url: 'https://www.woofi-developments.at/',
        }),
        'http',
    );
});

test('plain url, no containerApp -> http', () => {
    assert.equal(resolveCheckMode({ url: 'https://status.woofi-developments.at/' }), 'http');
});

test('neither url nor an ARM-managed containerApp -> skip (preussen-bot)', () => {
    assert.equal(resolveCheckMode({ name: 'preussen-bot' }), 'skip');
});

test('stale containerApp outside the allowlist and no url -> skip, never a fabricated check', () => {
    assert.equal(
        resolveCheckMode({
            containerApp: { resourceGroup: 'preussen-bot-rg', name: 'preussen-bot' },
        }),
        'skip',
    );
});
