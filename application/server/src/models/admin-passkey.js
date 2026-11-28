import mongoose from 'mongoose';

/** A passkey that may sign in as the admin. The public key is all the server keeps. */
const adminPasskeySchema = new mongoose.Schema(
    {
        credentialId: { type: String, required: true, unique: true },
        publicKey: { type: Buffer, required: true },
        counter: { type: Number, required: true, default: 0 },
        transports: { type: [String], default: [] },
        backedUp: { type: Boolean, default: false },
        name: { type: String, required: true, maxlength: 60 },
        lastUsedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

export const AdminPasskey = mongoose.model('AdminPasskey', adminPasskeySchema);
