// A record keeps the language it was written in in its own fields and the other language in
// `translations.<locale>`. Returns the record as it should read in `locale`; a record with no
// translation for that language is shown as written rather than hidden.
export function localize(item, locale) {
    const translated = item?.translations?.[locale];
    return translated ? { ...item, ...translated } : item;
}

export function localizeAll(items, locale) {
    return items.map((item) => localize(item, locale));
}
