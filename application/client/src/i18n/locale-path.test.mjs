import test from 'node:test';
import assert from 'node:assert/strict';
import { localeFromPath, stripLocale, withLocale, localizeTo } from './locale-path.js';

test('the language is read from the first path segment only', () => {
    assert.equal(localeFromPath('/de'), 'de');
    assert.equal(localeFromPath('/de/career'), 'de');
    assert.equal(localeFromPath('/career'), 'en');
    assert.equal(localeFromPath('/'), 'en');
    assert.equal(localeFromPath('/design'), 'en');
    assert.equal(localeFromPath('/delta/de'), 'en');
});

test('stripLocale and withLocale round-trip', () => {
    assert.equal(stripLocale('/de'), '/');
    assert.equal(stripLocale('/de/career'), '/career');
    assert.equal(stripLocale('/design'), '/design');
    assert.equal(withLocale('/', 'de'), '/de');
    assert.equal(withLocale('/career', 'de'), '/de/career');
    assert.equal(withLocale('/career', 'en'), '/career');
});

test('localizeTo prefixes app paths and keeps query and hash', () => {
    assert.equal(localizeTo('/services', 'de'), '/de/services');
    assert.equal(localizeTo('/', 'de'), '/de');
    assert.equal(localizeTo('/status?from=2026-01-01#top', 'de'), '/de/status?from=2026-01-01#top');
    assert.equal(localizeTo('/services', 'en'), '/services');
    assert.equal(localizeTo('https://example.com/x', 'de'), 'https://example.com/x');
});
