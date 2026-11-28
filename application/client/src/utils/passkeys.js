import {
    browserSupportsWebAuthn,
    startAuthentication,
    startRegistration,
} from '@simplewebauthn/browser';
import { authHeaders } from './auth.js';

export const passkeysSupported = () => browserSupportsWebAuthn();

async function call(method, url, body, withAuth) {
    const response = await fetch(url, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(withAuth ? authHeaders() : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'Request failed.');
    }
    return response.status === 204 ? null : response.json();
}

/** Asks the browser for a passkey, finishes the sign-in on the server and returns the admin token. */
export async function signInWithPasskey() {
    const { ceremonyId, options } = await call('POST', '/auth/passkey/options', {});
    const response = await startAuthentication({ optionsJSON: options });
    const { token } = await call('POST', '/auth/passkey/login', { ceremonyId, response });
    return token;
}

export async function addPasskey(name) {
    const { ceremonyId, options } = await call('POST', '/auth/passkeys/register/options', {}, true);
    const response = await startRegistration({ optionsJSON: options });
    return (await call('POST', '/auth/passkeys/register', { ceremonyId, name, response }, true))
        .passkey;
}

export const listPasskeys = async () => (await call('GET', '/auth/passkeys', null, true)).passkeys;
export const removePasskey = (id) => call('DELETE', `/auth/passkeys/${id}`, null, true);
