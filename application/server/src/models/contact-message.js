import mongoose from 'mongoose';

// A message sent through the contact form. Deliberately no IP address and no user agent:
// the form is for people to reach me, not for tracking them (see the privacy policy).
const contactMessageSchema = new mongoose.Schema({
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, required: true, maxlength: 254 },
    subject: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 4000 },
    locale: { type: String, enum: ['en', 'de'], default: 'en' },
    // Auto-delete after 90 days (same TTL pattern as monitor-check.js). Deleting an answered
    // message earlier is the admin's DELETE /api/contact/:id.
    createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 },
});

const ContactMessageModel = mongoose.model('ContactMessage', contactMessageSchema);

export { ContactMessageModel };
