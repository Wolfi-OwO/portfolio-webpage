import test from 'node:test';
import assert from 'node:assert/strict';

process.env.CONTAINER_APP_RESOURCE_GROUPS = '';
const { checkerHasNetwork } = await import('./checkMonitors.js');

const realFetch = globalThis.fetch;
test.afterEach(() => {
    globalThis.fetch = realFetch;
});

test('one canary answering is enough', async () => {
    globalThis.fetch = async (url) => {
        if (String(url).includes('a.example')) throw new Error('fetch failed');
        return { status: 204 };
    };
    assert.equal(await checkerHasNetwork(['https://a.example/', 'https://b.example/'], 0), true);
});

test('no canary answering, twice, means the checker is offline', async () => {
    let calls = 0;
    globalThis.fetch = async () => {
        calls += 1;
        throw new Error('fetch failed');
    };
    assert.equal(await checkerHasNetwork(['https://a.example/', 'https://b.example/'], 0), false);
    assert.equal(calls, 4, 'both canaries probed, then once more after the delay');
});

test('a canary that recovers on the second round counts as online', async () => {
    let round = 0;
    globalThis.fetch = async () => {
        round += 1;
        if (round <= 2) throw new Error('fetch failed');
        return { status: 200 };
    };
    assert.equal(await checkerHasNetwork(['https://a.example/', 'https://b.example/'], 0), true);
});
