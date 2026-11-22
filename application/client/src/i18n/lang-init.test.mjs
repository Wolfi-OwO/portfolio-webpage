import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../../public/lang-init.js', import.meta.url), 'utf8');

// Runs the real script against a fake browser and reports where it sent the visitor, if anywhere.
function run({ path, languages, saved, search = '', hash = '' }) {
    let target = null;
    const sandbox = {
        location: { pathname: path, search, hash, replace: (u) => (target = u) },
        navigator: { languages, language: languages?.[0] },
        localStorage: { getItem: () => saved ?? null },
    };
    vm.runInNewContext(code, sandbox);
    return target;
}

test('a browser that lists German first is sent to the German page', () => {
    assert.equal(run({ path: '/', languages: ['de-AT', 'en'] }), '/de');
    assert.equal(run({ path: '/services', languages: ['de'] }), '/de/services');
    assert.equal(
        run({ path: '/career/', languages: ['de-DE'], search: '?a=1', hash: '#x' }),
        '/de/career?a=1#x',
    );
});

test('English first, or nothing listed, stays on the English page', () => {
    assert.equal(run({ path: '/', languages: ['en-US', 'de'] }), null);
    assert.equal(run({ path: '/', languages: ['fr'] }), null);
    assert.equal(run({ path: '/', languages: [] }), null);
});

test('an explicit choice wins over the browser setting, in both directions', () => {
    assert.equal(run({ path: '/', languages: ['de'], saved: 'en' }), null);
    assert.equal(run({ path: '/', languages: ['en-US'], saved: 'de' }), '/de');
});

test('German pages are never redirected', () => {
    assert.equal(run({ path: '/de', languages: ['en-US'] }), null);
    assert.equal(run({ path: '/de/services', languages: ['en-US'], saved: 'en' }), null);
});

test('private and unknown paths are left alone', () => {
    for (const path of ['/secret', '/admin/login', '/gibt-es-nicht', '/api/info']) {
        assert.equal(run({ path, languages: ['de'] }), null, path);
    }
});
