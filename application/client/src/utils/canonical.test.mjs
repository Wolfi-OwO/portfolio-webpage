import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canonicalUrl, SITE_ORIGIN } from './canonical.js';

test('the homepage canonical is the bare origin with a slash', () => {
    assert.equal(canonicalUrl('/'), `${SITE_ORIGIN}/`);
});

test('a route is its own canonical', () => {
    assert.equal(canonicalUrl('/career'), `${SITE_ORIGIN}/career`);
    assert.equal(canonicalUrl('/services'), `${SITE_ORIGIN}/services`);
});

test('a trailing slash does not create a second canonical', () => {
    assert.equal(canonicalUrl('/career/'), `${SITE_ORIGIN}/career`);
    assert.equal(canonicalUrl('/career//'), `${SITE_ORIGIN}/career`);
});

test('garbage input falls back to the homepage', () => {
    assert.equal(canonicalUrl(undefined), `${SITE_ORIGIN}/`);
    assert.equal(canonicalUrl('career'), `${SITE_ORIGIN}/`);
});
