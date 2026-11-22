import test from 'node:test';
import assert from 'node:assert/strict';
import { localize, localizeAll } from './localize.js';

const service = {
    title: 'Webanwendung',
    description: 'Eine echte Applikation',
    priceFrom: 1200,
    translations: { en: { title: 'Web application', description: 'A real application' } },
};

test('a translation replaces only the fields it carries', () => {
    const en = localize(service, 'en');
    assert.equal(en.title, 'Web application');
    assert.equal(en.description, 'A real application');
    assert.equal(en.priceFrom, 1200);
});

test('a record is shown as written when it has no translation for the language', () => {
    assert.equal(localize(service, 'de').title, 'Webanwendung');
    assert.equal(localize({ title: 'x' }, 'en').title, 'x');
    assert.equal(localize(undefined, 'en'), undefined);
});

test('localizeAll maps every record', () => {
    assert.deepEqual(
        localizeAll([service, { title: 'x' }], 'en').map((s) => s.title),
        ['Web application', 'x'],
    );
});
