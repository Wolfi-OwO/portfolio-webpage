/**
 * The admin pages never send the typed password. They send a proof derived from it, so the password is not in the
 * request, not in a proxy's log and not in anything between the browser and the server. The server hashes the proof
 * again before storing it.
 *
 * The salt is fixed because there is one admin and the secret page has no username to add to it.
 */
const ITERATIONS = 310_000;
const PREFIX = 'pw1$';
const SALT = 'portfolio:password:v1:admin';

const base64url = (bytes) =>
    btoa(String.fromCharCode(...bytes))
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');

/** @param {string} password What the person typed. @returns {Promise<string>} `pw1$` and 43 characters. */
export async function derivePasswordProof(password) {
    const text = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        text.encode(password.normalize('NFKC')),
        'PBKDF2',
        false,
        ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: text.encode(SALT) },
        key,
        256,
    );
    return PREFIX + base64url(new Uint8Array(bits));
}

/**
 * POSTs a form that carries the admin password as a proof. The first sign-in after the server moved to proofs is
 * refused once with `legacyLogin: true`; the page then repeats the request once with the typed password so the server
 * can check the old hash and store the proof.
 *
 * @param {string} url
 * @param {Record<string, unknown>} fields Everything but the password.
 * @param {string} password
 * @returns {Promise<Response>}
 */
export async function postWithProof(url, fields, password) {
    const proof = await derivePasswordProof(password);
    const send = (extra) =>
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...fields, password: proof, ...extra }),
        });
    const first = await send();
    if (first.status !== 401) return first;
    const body = await first
        .clone()
        .json()
        .catch(() => ({}));
    return body.legacyLogin ? send({ legacyPassword: password }) : first;
}
