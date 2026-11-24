// What may be attached, and how a file is proven to be what it says it is. A file is kept only when its first bytes
// match its declared type, so a script renamed to .pdf is refused instead of being served from this origin.

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_ENTRY = 8;

const startsWith = (buf, bytes) => bytes.every((b, i) => buf[i] === b);

/** mime -> { inline: shown in the browser, check: does the content match } */
export const ALLOWED = {
    'application/pdf': {
        inline: true,
        check: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d]),
    },
    'image/png': { inline: true, check: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47]) },
    'image/jpeg': { inline: true, check: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
    'image/webp': {
        inline: true,
        check: (b) =>
            startsWith(b, [0x52, 0x49, 0x46, 0x46]) && b.subarray(8, 12).toString() === 'WEBP',
    },
    // Text is shown as plain text only, never sniffed into HTML.
    'text/plain': { inline: true, check: (b) => !b.includes(0) },
    // Office files are a zip underneath; they are offered as downloads, never opened in the page.
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        inline: false,
        check: (b) => startsWith(b, [0x50, 0x4b]),
    },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
        inline: false,
        check: (b) => startsWith(b, [0x50, 0x4b]),
    },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        inline: false,
        check: (b) => startsWith(b, [0x50, 0x4b]),
    },
};

export const ALLOWED_TYPES = Object.keys(ALLOWED);

/** A display name that cannot carry a path or control characters. */
export function cleanName(raw) {
    // A repeated header arrives as an array; only one string is ever used.
    if (Array.isArray(raw)) raw = raw[0];
    let name = '';
    try {
        name = decodeURIComponent(String(raw ?? ''));
    } catch {
        name = String(raw ?? '');
    }
    // Path separators become spaces; quotes and control characters (code below 32, and 127) are dropped.
    name = Array.from(name.replace(/[\\/]+/g, ' '))
        .filter((ch) => ch !== '"' && ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) !== 127)
        .join('')
        .trim()
        .slice(0, 120);
    return name || 'attachment';
}
