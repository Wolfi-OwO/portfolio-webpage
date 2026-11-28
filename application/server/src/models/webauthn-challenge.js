import mongoose from 'mongoose';

/**
 * A passkey ceremony in flight. Single use: it is deleted when read, and Mongo
 * drops an unanswered one after its expiry, so a challenge cannot be replayed.
 */
const challengeSchema = new mongoose.Schema({
    challenge: { type: String, required: true },
    purpose: { type: String, enum: ['register', 'login'], required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

export const WebauthnChallenge = mongoose.model('WebauthnChallenge', challengeSchema);
