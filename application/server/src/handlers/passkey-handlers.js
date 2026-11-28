import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import {
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { BadRequest, NotFound, Unauthorized } from '../middlewares/error-handlers.js';
import { AdminPasskey } from '../models/admin-passkey.js';
import { WebauthnChallenge } from '../models/webauthn-challenge.js';

const RP_NAME = 'Woofi Developments';
const CEREMONY_SECONDS = 300;
const MAX_PASSKEYS = 10;

/**
 * The origins a passkey may be used from. Taken from the deployment, never from the request's Host header, so a forged
 * header cannot name another site. The first one fixes the relying-party id.
 */
function allowedOrigins() {
    return (
        process.env.WEBAUTHN_ORIGINS ||
        'https://www.woofi-developments.at,https://woofi-developments.at'
    )
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
}

function rpId() {
    return new URL(allowedOrigins()[0]).hostname;
}

async function saveChallenge(challenge, purpose) {
    const doc = await WebauthnChallenge.create({
        challenge,
        purpose,
        expiresAt: new Date(Date.now() + CEREMONY_SECONDS * 1000),
    });
    return String(doc._id);
}

/** Reads a challenge and deletes it in the same step, so it works once. */
async function takeChallenge(ceremonyId, purpose) {
    if (typeof ceremonyId !== 'string' || !/^[0-9a-f]{24}$/.test(ceremonyId)) return null;
    const doc = await WebauthnChallenge.findOneAndDelete({
        _id: { $eq: ceremonyId },
        purpose,
        expiresAt: { $gt: new Date() },
    });
    return doc ? doc.challenge : null;
}

const view = (p) => ({
    id: String(p._id),
    name: p.name,
    createdAt: p.createdAt,
    lastUsedAt: p.lastUsedAt,
    backedUp: p.backedUp,
});

async function registrationOptions(req, res, next) {
    try {
        const existing = await AdminPasskey.find().lean();
        if (existing.length >= MAX_PASSKEYS) {
            return next(new BadRequest(`At most ${MAX_PASSKEYS} passkeys.`));
        }
        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: rpId(),
            userName: process.env.ADMIN_USER || 'admin',
            userID: new TextEncoder().encode('portfolio-admin'),
            attestationType: 'none',
            excludeCredentials: existing.map((p) => ({
                id: p.credentialId,
                transports: p.transports,
            })),
            authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
        });
        const ceremonyId = await saveChallenge(options.challenge, 'register');
        return res.json({ ceremonyId, options });
    } catch (err) {
        return next(err);
    }
}

async function finishRegistration(req, res, next) {
    try {
        const { ceremonyId, name, response } = req.body || {};
        const challenge = await takeChallenge(ceremonyId, 'register');
        if (!challenge || !response) {
            return next(new BadRequest('That passkey request has expired. Start again.'));
        }
        const result = await verifyRegistrationResponse({
            response,
            expectedChallenge: challenge,
            expectedOrigin: allowedOrigins(),
            expectedRPID: rpId(),
            requireUserVerification: false,
        }).catch(() => null);
        if (!result?.verified) return next(new BadRequest('The passkey could not be verified.'));
        const { credential, credentialBackedUp } = result.registrationInfo;
        if (await AdminPasskey.exists({ credentialId: { $eq: credential.id } })) {
            return next(new BadRequest('That passkey is already registered.'));
        }
        const saved = await AdminPasskey.create({
            credentialId: credential.id,
            publicKey: Buffer.from(credential.publicKey),
            counter: credential.counter,
            transports: credential.transports ?? [],
            backedUp: credentialBackedUp,
            name:
                String(name || '')
                    .trim()
                    .slice(0, 60) || 'Passkey',
        });
        return res.status(201).json({ passkey: view(saved) });
    } catch (err) {
        return next(err);
    }
}

async function listPasskeys(_req, res, next) {
    try {
        const all = await AdminPasskey.find().sort({ createdAt: 1 }).lean();
        return res.json({ passkeys: all.map(view) });
    } catch (err) {
        return next(err);
    }
}

async function removePasskey(req, res, next) {
    try {
        if (!/^[0-9a-f]{24}$/.test(req.params.id)) return next(new NotFound('No such passkey.'));
        const gone = await AdminPasskey.findOneAndDelete({ _id: { $eq: req.params.id } });
        if (!gone) return next(new NotFound('No such passkey.'));
        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}

async function loginOptions(_req, res, next) {
    try {
        const options = await generateAuthenticationOptions({
            rpID: rpId(),
            userVerification: 'preferred',
        });
        const ceremonyId = await saveChallenge(options.challenge, 'login');
        return res.json({ ceremonyId, options });
    } catch (err) {
        return next(err);
    }
}

async function finishLogin(req, res, next) {
    try {
        const { ceremonyId, response } = req.body || {};
        const refuse = () => next(new Unauthorized('That passkey could not be used.'));
        const challenge = await takeChallenge(ceremonyId, 'login');
        if (!challenge || typeof response?.id !== 'string') return refuse();
        const stored = await AdminPasskey.findOne({ credentialId: { $eq: response.id } });
        if (!stored) return refuse();
        const result = await verifyAuthenticationResponse({
            response,
            expectedChallenge: challenge,
            expectedOrigin: allowedOrigins(),
            expectedRPID: rpId(),
            credential: {
                id: stored.credentialId,
                publicKey: new Uint8Array(stored.publicKey),
                counter: stored.counter,
                transports: stored.transports,
            },
            requireUserVerification: false,
        }).catch(() => null);
        if (!result?.verified) return refuse();
        stored.counter = result.authenticationInfo.newCounter;
        stored.lastUsedAt = new Date();
        await stored.save();
        const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
        const token = jwt.sign(
            { sub: process.env.ADMIN_USER || 'admin', role: 'admin', jti: crypto.randomUUID() },
            process.env.JWT_SECRET,
            { expiresIn },
        );
        return res.json({ token, expiresIn });
    } catch (err) {
        return next(err);
    }
}

export {
    registrationOptions,
    finishRegistration,
    listPasskeys,
    removePasskey,
    loginOptions,
    finishLogin,
};
