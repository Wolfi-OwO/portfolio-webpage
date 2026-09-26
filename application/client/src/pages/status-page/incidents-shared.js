// Pure incident-list transforms for IncidentsPage — plain .js (no JSX), so
// this can be unit-tested with plain `node` the same way availability.js is
// (see incidents-shared.test.mjs), and so the flatten/sort/group logic isn't
// buried inside a component that can only be exercised through a render.

// Flattens every monitor's incidents[] into one list, tagging each with the
// monitor's own display name (and group, when it has one) — the fields the
// API already put on each incident (startedAt/endedAt/durationSeconds, see
// metrion-adapter.js#buildMetrionRangeStatuses) are kept untouched.
export function collectIncidents(monitors) {
    return monitors.flatMap((monitor) =>
        (monitor.incidents ?? []).map((inc) => ({
            ...inc,
            monitorName: monitor.name,
            group: monitor.group || null,
        })),
    );
}

export function sortByStartedAtDesc(incidents) {
    return [...incidents].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}

// Calendar-day key in the viewer's local timezone — matches fmtDate's own
// local rendering, so a group's day heading always agrees with the date an
// incident's own row would print.
function dayKey(ms) {
    const d = new Date(ms);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Assumes `incidents` is already newest-first (sortByStartedAtDesc) — groups
// consecutive same-day incidents under one heading without re-sorting, so a
// day's incidents always land in one group instead of scattering across two
// if the list weren't pre-sorted.
export function groupByDay(incidents) {
    const groups = [];
    for (const inc of incidents) {
        const ms = Date.parse(inc.startedAt);
        const key = dayKey(ms);
        const last = groups[groups.length - 1];
        if (last && last.key === key) {
            last.incidents.push(inc);
        } else {
            groups.push({ key, dayMs: ms, incidents: [inc] });
        }
    }
    return groups;
}
