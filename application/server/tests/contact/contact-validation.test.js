/* ***************** IMPORT packages *********************** */
import assert from 'assert';
import { validateContact } from '../../src/utils/contact-validation.js';

/* ***************** SETUP *********************** */
// A fixed clock keeps the 3 s / 24 h timing rules deterministic.
const NOW = 1_800_000_000_000;
const valid = () => ({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    subject: 'Hello',
    message: 'I would like to talk about a project.',
    startedAt: NOW - 10_000,
});
const errorsFor = (patch) => validateContact({ ...valid(), ...patch }, NOW).errors;

/* ***************** DECLARE testfunctions *********************** */
describe('validateContact', function () {
    it('accepts a valid message, trims fields and defaults the locale', function () {
        const r = validateContact({ ...valid(), name: '  Ada  ' }, NOW);
        assert.deepStrictEqual(r, {
            ok: true,
            spam: null,
            value: {
                name: 'Ada',
                email: 'ada@example.com',
                subject: 'Hello',
                message: 'I would like to talk about a project.',
                locale: 'en',
            },
        });
    });

    it('keeps an explicit supported locale and rejects an unsupported one', function () {
        assert.strictEqual(validateContact({ ...valid(), locale: 'de' }, NOW).value.locale, 'de');
        assert.strictEqual(errorsFor({ locale: 'fr' }).locale, 'invalid_format');
    });

    it('needs every text field', function () {
        for (const field of ['name', 'email', 'subject', 'message']) {
            const body = valid();
            delete body[field];
            assert.strictEqual(validateContact(body, NOW).errors[field], 'required', field);
            assert.strictEqual(errorsFor({ [field]: '   ' })[field], 'required', `${field} blank`);
        }
    });

    it('enforces the length limits at the boundaries', function () {
        assert.strictEqual(errorsFor({ name: 'a'.repeat(81) }).name, 'too_long');
        assert.strictEqual(validateContact({ ...valid(), name: 'a'.repeat(80) }, NOW).ok, true);
        assert.strictEqual(errorsFor({ subject: 'a'.repeat(121) }).subject, 'too_long');
        assert.strictEqual(errorsFor({ message: 'too short' }).message, 'too_short');
        assert.strictEqual(validateContact({ ...valid(), message: 'a'.repeat(10) }, NOW).ok, true);
        assert.strictEqual(errorsFor({ message: 'a'.repeat(4001) }).message, 'too_long');
        const longEmail = `${'a'.repeat(250)}@example.com`;
        assert.strictEqual(errorsFor({ email: longEmail }).email, 'too_long');
    });

    it('rejects malformed addresses', function () {
        for (const email of ['nope', 'a@b', '@example.com', 'a b@example.com', 'a@@example.com']) {
            assert.strictEqual(errorsFor({ email }).email, 'invalid_format', email);
        }
    });

    it('rejects non-string values', function () {
        assert.strictEqual(errorsFor({ name: 42 }).name, 'invalid_format');
        assert.strictEqual(errorsFor({ message: ['x'] }).message, 'invalid_format');
    });

    it('rejects control characters, and CR/LF where a mail header could be injected', function () {
        assert.strictEqual(errorsFor({ name: 'Ada\u0000' }).name, 'control_chars');
        assert.strictEqual(errorsFor({ name: 'Ada\r\nBcc: x@y.z' }).name, 'control_chars');
        assert.strictEqual(
            errorsFor({ email: 'a@example.com\nBcc: x@y.z' }).email,
            'control_chars',
        );
        assert.strictEqual(errorsFor({ subject: 'Hi\nthere' }).subject, 'control_chars');
        assert.strictEqual(errorsFor({ message: 'ten chars\u0007!!' }).message, 'control_chars');
    });

    it('allows line breaks in the message body', function () {
        const r = validateContact({ ...valid(), message: 'First line.\r\nSecond line.' }, NOW);
        assert.strictEqual(r.ok, true);
    });

    it('rejects unknown fields', function () {
        assert.strictEqual(errorsFor({ isAdmin: true }).isAdmin, 'unknown_field');
    });

    it('rejects a body that is not an object', function () {
        for (const body of [null, undefined, 'x', 5, []]) {
            assert.strictEqual(validateContact(body, NOW).ok, false);
        }
    });

    it('treats a filled honeypot as spam, ahead of every other problem', function () {
        const r = validateContact({ ...valid(), website: 'https://spam.example', email: 'x' }, NOW);
        assert.deepStrictEqual(r, { ok: true, spam: 'honeypot' });
        assert.strictEqual(validateContact({ ...valid(), website: '' }, NOW).spam, null);
        assert.strictEqual(validateContact({ ...valid(), website: '   ' }, NOW).spam, null);
    });

    it('treats a submission under 3 s or over 24 h old as timing spam', function () {
        assert.strictEqual(
            validateContact({ ...valid(), startedAt: NOW - 2_999 }, NOW).spam,
            'timing',
        );
        assert.strictEqual(validateContact({ ...valid(), startedAt: NOW - 3_000 }, NOW).spam, null);
        assert.strictEqual(
            validateContact({ ...valid(), startedAt: NOW + 5_000 }, NOW).spam,
            'timing',
        );
        const day = 24 * 60 * 60 * 1000;
        assert.strictEqual(validateContact({ ...valid(), startedAt: NOW - day }, NOW).spam, null);
        assert.strictEqual(
            validateContact({ ...valid(), startedAt: NOW - day - 1 }, NOW).spam,
            'timing',
        );
    });

    it('needs startedAt as a number', function () {
        const body = valid();
        delete body.startedAt;
        assert.strictEqual(validateContact(body, NOW).errors.startedAt, 'required');
        assert.strictEqual(errorsFor({ startedAt: '123' }).startedAt, 'invalid_format');
        assert.strictEqual(errorsFor({ startedAt: Number.NaN }).startedAt, 'invalid_format');
    });

    it('reports every invalid field at once', function () {
        const r = validateContact({ ...valid(), email: 'x', message: 'short' }, NOW);
        assert.deepStrictEqual(r.errors, { email: 'invalid_format', message: 'too_short' });
    });
});
