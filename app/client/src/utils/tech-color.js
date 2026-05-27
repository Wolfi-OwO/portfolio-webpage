const CUSTOM_PREFIX = 'custom:';

function isCustomColor(color) {
    return typeof color === 'string' && color.startsWith(CUSTOM_PREFIX);
}

function makeCustomColor(hex) {
    return `${CUSTOM_PREFIX}${hex}`;
}

function readCustomHex(color) {
    return isCustomColor(color) ? color.slice(CUSTOM_PREFIX.length) : null;
}

function pickContrastingText(hex) {
    if (!hex || hex.length < 7) return '#0f172a';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#0f172a' : '#f8fafc';
}

function rgbToHex(r, g, b) {
    const toHex = n => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseRgbInput(value) {
    if (!value) return null;
    const trimmed = value.trim();

    if (/^#?[0-9a-fA-F]{6}$/.test(trimmed)) {
        return trimmed.startsWith('#') ? trimmed.toLowerCase() : `#${trimmed.toLowerCase()}`;
    }

    if (/^#?[0-9a-fA-F]{3}$/.test(trimmed)) {
        const h = trimmed.replace('#', '');
        return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
    }

    const match = trimmed.match(/(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
    if (match) {
        return rgbToHex(Number(match[1]), Number(match[2]), Number(match[3]));
    }

    return null;
}

function chipProps(color) {
    const hex = readCustomHex(color);
    if (hex) {
        return {
            style: {
                backgroundColor: hex,
                color: pickContrastingText(hex),
            },
        };
    }
    return { className: color };
}

export {
    isCustomColor,
    makeCustomColor,
    readCustomHex,
    pickContrastingText,
    rgbToHex,
    parseRgbInput,
    chipProps,
};
