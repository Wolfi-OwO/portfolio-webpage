import test from 'node:test';
import assert from 'node:assert/strict';
import { translationToForm, translationToPayload } from './translation-form.js';

const FIELDS = [{ key: 'title' }, { key: 'description' }, { key: 'deliverables', list: true }];

test('the form shows saved text and joins lists into lines', () => {
    const t = { en: { title: 'Web application', deliverables: ['A', 'B'] } };
    assert.deepEqual(translationToForm(t, 'en', FIELDS), {
        title: 'Web application',
        description: '',
        deliverables: 'A\nB',
    });
    assert.deepEqual(translationToForm(undefined, 'en', FIELDS), {
        title: '',
        description: '',
        deliverables: '',
    });
});

test('saving keeps filled fields, trims them and splits lines', () => {
    const out = translationToPayload(
        undefined,
        'en',
        { title: ' Web application ', description: '', deliverables: 'A\n\n B \n' },
        FIELDS,
    );
    assert.deepEqual(out, { en: { title: 'Web application', deliverables: ['A', 'B'] } });
});

test('saving leaves other languages alone', () => {
    const out = translationToPayload({ fr: { title: 'x' } }, 'en', { title: 'Y' }, FIELDS);
    assert.deepEqual(out, { fr: { title: 'x' }, en: { title: 'Y' } });
});

test('clearing every field removes the language, and the last one gives null', () => {
    assert.deepEqual(
        translationToPayload(
            { fr: { title: 'x' }, en: { title: 'Y' } },
            'en',
            { title: '' },
            FIELDS,
        ),
        { fr: { title: 'x' } },
    );
    assert.equal(translationToPayload({ en: { title: 'Y' } }, 'en', { title: '  ' }, FIELDS), null);
});
