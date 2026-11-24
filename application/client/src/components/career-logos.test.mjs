import test from 'node:test';
import assert from 'node:assert/strict';
import { logoFor } from './career-logos.js';

test('every organisation has a logo in both languages', () => {
    for (const org of [
        'Infineon Technologies',
        'Bundesheer',
        'Österreichisches Bundesheer',
        'Austrian Armed Forces',
        'HTL Villach',
        'Peraugymnasium',
    ])
        assert.ok(logoFor(org), `${org} has no logo`);
});

test('the Bundesheer logo is used for its English name too', () => {
    assert.equal(logoFor('Austrian Armed Forces'), '/logos/bundesheer.png');
    assert.equal(logoFor('Bundesheer'), '/logos/bundesheer.png');
});

test('an organisation without a logo gets none', () => {
    assert.equal(logoFor('Somewhere Else'), undefined);
});
