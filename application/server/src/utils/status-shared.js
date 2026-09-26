// Shared between the Mongo-measured path (status-checker.js) and the
// Metrion-measured path (metrion-adapter.js), so the severity bands and the
// day/rounding helpers exist in exactly one place regardless of which source
// built a given report.

const DAY = 24 * 60 * 60 * 1000;
const round1 = (n) => Math.round(n * 10) / 10;

// Discord-style: one bar per calendar day, colored by how much of that day
// was down — not one bar per raw check (which, at a short check interval,
// would only cover the last few minutes instead of the last 90 days).
//
// The colour reflects how LONG the day was down, not that a failure existed.
// Under the old rule (any failure -> minor, up to 10% -> minor) 47 of Network
// Visualizer's 58 amber days and 32 of the Preview's 40 came from <= 0.2% down
// (1-3 failed checks), while a day with 9% downtime (2.2 h) rendered the very
// same amber. 0.5% is ~7 min of a day.
function severityFor(downRatio) {
    if (downRatio <= 0.005) return 'operational';
    if (downRatio <= 0.05) return 'minor';
    if (downRatio <= 0.2) return 'major';
    return 'critical';
}

export { DAY, round1, severityFor };
