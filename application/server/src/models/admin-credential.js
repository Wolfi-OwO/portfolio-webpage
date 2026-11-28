import mongoose from 'mongoose';

/**
 * The admin password in the proof scheme: a bcrypt hash of the proof the login
 * page derives in the browser, so the typed password never reaches the server.
 * One document at most. Until it exists the env hash of the typed password is
 * the only credential; the first proof sign-in writes this one.
 */
const adminCredentialSchema = new mongoose.Schema(
    { proofHash: { type: String, required: true } },
    { timestamps: true },
);

export const AdminCredential = mongoose.model('AdminCredential', adminCredentialSchema);
