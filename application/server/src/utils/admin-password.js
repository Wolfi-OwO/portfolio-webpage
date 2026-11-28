import bcrypt from 'bcryptjs';
import { AdminCredential } from '../models/admin-credential.js';

export const PROOF_PREFIX = 'pw1$';

// Keeps the timing of a refusal close to a real comparison.
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO4pXEbf/pZ0GN2QxU9L1SgFsMImk.KX2';

/** True while the stored credential is still the typed-password hash from the env. */
async function isLegacy() {
    return !(await AdminCredential.exists({}));
}

/**
 * Checks what the login page sent.
 *
 * - `password` is normally a proof (`pw1$...`). It is matched against the stored proof hash.
 * - Before a proof is stored, the same request carries `legacyPassword` (the typed one) once; it is checked against
 *   the env hash and, when right, the proof is stored so the next sign-in needs no typed password.
 * - A page cached from before the change still sends the typed password as `password`; it is checked against the env
 *   hash and keeps working.
 *
 * @param {string} password
 * @param {string | undefined} legacyPassword
 * @returns {Promise<boolean>}
 */
async function verifyAdminPassword(password, legacyPassword) {
    const envHash = process.env.ADMIN_PASSWORD_HASH || DUMMY_HASH;
    const isProof = password.startsWith(PROOF_PREFIX);

    if (!isProof) return bcrypt.compare(password, envHash);

    const stored = await AdminCredential.findOne().lean();
    if (stored && (await bcrypt.compare(password, stored.proofHash))) return true;

    if (typeof legacyPassword === 'string' && legacyPassword) {
        if (!(await bcrypt.compare(legacyPassword, envHash))) return false;
        const proofHash = await bcrypt.hash(password, 12);
        await AdminCredential.findOneAndUpdate({}, { proofHash }, { upsert: true });
        return true;
    }

    if (!stored) await bcrypt.compare(password, DUMMY_HASH);
    return false;
}

export { verifyAdminPassword, isLegacy };
