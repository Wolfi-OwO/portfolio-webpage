/* ***************** Contact form validation ***************** */
// Pure function, no database and no request object, so it can be tested without Mongo.
// Error codes are deliberately few: required, too_short, too_long, invalid_format,
// control_chars, unknown_field. The client maps them to translated messages.

const LIMITS = {
    name: { min: 1, max: 80 },
    email: { max: 254 },
    subject: { min: 1, max: 120 },
    message: { min: 10, max: 4000 },
};
const LOCALES = ['en', 'de'];
const ALLOWED_FIELDS = new Set([
    'name',
    'email',
    'subject',
    'message',
    'locale',
    'website',
    'startedAt',
]);

// Control characters other than TAB, LF and CR. Free-text messages may contain line breaks.
// Matching control characters is the whole point of these two patterns.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
// name, email and subject can end up in a mail header one day: no CR/LF there either.
// eslint-disable-next-line no-control-regex
const HEADER_UNSAFE = /[\u0000-\u0008\u000A-\u001F\u007F]/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_AGE_MS = 3 * 1000; // a person needs more than 3 s to fill the form; a script does not
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function checkText(value, field, { headerSafe }) {
    if (value === undefined || value === null) return { code: 'required' };
    if (typeof value !== 'string') return { code: 'invalid_format' };

    const text = value.trim();
    const { min = 0, max } = LIMITS[field];

    if (text.length === 0) return { code: 'required' };
    if ((headerSafe ? HEADER_UNSAFE : CONTROL_CHARS).test(text)) return { code: 'control_chars' };
    if (text.length < min) return { code: 'too_short' };
    if (text.length > max) return { code: 'too_long' };
    return { text };
}

/**
 * @param {unknown} body - parsed JSON body of POST /api/contact
 * @param {number} [now] - injectable clock for tests
 * @returns {{ ok: true, spam: null | 'honeypot' | 'timing', value?: object }
 *         | { ok: false, errors: Record<string, string> }}
 *   `spam` set means: answer as if it worked but store nothing. A filled honeypot wins over every
 *   other check so a bot gets no hint about what else was wrong.
 */
function validateContact(body, now = Date.now()) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return { ok: false, errors: { body: 'invalid_format' } };
    }

    if (typeof body.website === 'string' ? body.website.trim() !== '' : body.website != null) {
        return { ok: true, spam: 'honeypot' };
    }

    const errors = {};
    for (const key of Object.keys(body)) {
        if (!ALLOWED_FIELDS.has(key)) errors[key] = 'unknown_field';
    }

    const value = {};
    for (const [field, headerSafe] of [
        ['name', true],
        ['email', true],
        ['subject', true],
        ['message', false],
    ]) {
        const r = checkText(body[field], field, { headerSafe });
        if (r.code) errors[field] = r.code;
        else value[field] = r.text;
    }
    if (!errors.email && !EMAIL.test(value.email)) errors.email = 'invalid_format';

    if (body.locale === undefined || body.locale === null) value.locale = 'en';
    else if (LOCALES.includes(body.locale)) value.locale = body.locale;
    else errors.locale = 'invalid_format';

    let tooFastOrStale = false;
    if (body.startedAt === undefined || body.startedAt === null) errors.startedAt = 'required';
    else if (typeof body.startedAt !== 'number' || !Number.isFinite(body.startedAt)) {
        errors.startedAt = 'invalid_format';
    } else {
        const age = now - body.startedAt;
        tooFastOrStale = age < MIN_AGE_MS || age > MAX_AGE_MS;
    }

    if (Object.keys(errors).length > 0) return { ok: false, errors };
    return { ok: true, spam: tooFastOrStale ? 'timing' : null, value };
}

export { validateContact, LIMITS, MIN_AGE_MS, MAX_AGE_MS };
