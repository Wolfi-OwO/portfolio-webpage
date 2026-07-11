/**
 * Availability is one fact with two faces: the timeline draws it, the hero badge
 * summarises it. Both read from here, so the badge can never claim I am free
 * while the timeline says I am at the Bundesheer.
 */

/** The entry that contains `now`, or null when nothing is running. */
function currentEntry(entries, now = new Date()) {
    return (
        entries.find((entry) => {
            const start = new Date(entry.startDate);
            const end = entry.endDate ? new Date(entry.endDate) : null;

            return now >= start && (!end || now <= end);
        }) || null
    );
}

/**
 * What the hero badge says. Being mid-internship doesn't mean "not open" — it
 * means the honest offer is smaller: commissions on the side rather than a
 * full-time start. Only an 'available' block (or an empty calendar) claims the
 * bigger thing.
 */
function badgeState(entries, now = new Date()) {
    const current = currentEntry(entries, now);

    if (!current || current.kind === 'available') {
        return {
            id: 'availability.badge.openToWork',
            defaultMessage: 'Open to work',
            tone: 'live',
        };
    }

    return {
        id: 'availability.badge.openForCommissions',
        defaultMessage: 'Open for commissions',
        tone: 'accent',
    };
}

export { currentEntry, badgeState };
