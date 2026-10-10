// Form state helpers shared by the timeline editor and the inline editing on the career chart.

export const EMPTY_FORM = {
    _id: null,
    title: '',
    organisation: '',
    location: '',
    description: '',
    startDate: '',
    endDate: '',
    kind: 'work',
    published: true,
    tags: [],
};

/** yyyy-mm-dd, the only format <input type="date"> accepts. */
function toDateInput(value) {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
}

export function toForm(entry) {
    return {
        ...EMPTY_FORM,
        ...entry,
        organisation: entry.organisation || '',
        location: entry.location || '',
        description: entry.description || '',
        startDate: toDateInput(entry.startDate),
        endDate: toDateInput(entry.endDate),
        tags: (entry.tags || []).map((t) => t.tech),
    };
}

/**
 * `track: 'career'` is hard-set here, never read from `form` — that's what
 * keeps a career row from ever satisfying `currentEntry()`/`badgeState()`
 * (see utils/availability.js), which only look at `track: 'availability'`
 * rows. Tags are kept as plain tech-name strings in form state and only
 * expanded to the schema's {tech, color} shape here, at submit time, by
 * looking each one up in the fetched technologies list.
 */
export function toPayload(form, technologies) {
    return {
        title: form.title.trim(),
        organisation: form.organisation.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        // An empty end date means still ongoing, not "epoch".
        endDate: form.endDate || null,
        kind: form.kind,
        published: Boolean(form.published),
        track: 'career',
        tags: form.tags
            .map((techName) => technologies.find((t) => t.tech === techName))
            .filter(Boolean)
            .map((t) => ({ tech: t.tech, color: t.color })),
    };
}
