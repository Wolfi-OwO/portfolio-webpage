// Admin forms edit one other-language version of a record next to the language it was written in.
// `fields` lists what a translation carries: { key, list } where `list` fields are arrays edited as one line per item.

/** The form's text for one locale: every field as a string, arrays joined by newlines. */
export function translationToForm(translations, locale, fields) {
    const saved = translations?.[locale] ?? {};
    return Object.fromEntries(
        fields.map(({ key, list }) => [
            key,
            list ? (saved[key] ?? []).join('\n') : (saved[key] ?? ''),
        ]),
    );
}

/**
 * The `translations` value to save: the existing translations with this locale replaced by what the form
 * holds. Blank fields are left out, so the site shows the record as written for them; a locale with nothing
 * left is removed, and no translations at all is `null`. Other locales are never touched.
 */
export function translationToPayload(translations, locale, values, fields) {
    const built = {};
    for (const { key, list } of fields) {
        const raw = values?.[key] ?? '';
        if (list) {
            const items = raw
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean);
            if (items.length > 0) built[key] = items;
        } else if (raw.trim()) {
            built[key] = raw.trim();
        }
    }
    const next = { ...translations };
    if (Object.keys(built).length > 0) next[locale] = built;
    else delete next[locale];
    return Object.keys(next).length > 0 ? next : null;
}
