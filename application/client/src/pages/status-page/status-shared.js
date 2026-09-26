// Shared status-page building blocks: pulled out of status-page.jsx so
// incidents-page.jsx can reuse the exact same date/duration formatting and
// range-picker state instead of forking a second copy. status-page.jsx
// imports these back — its own behavior is unchanged, only the source
// location moved. Plain .js (no JSX) so it can export a component-hook mix
// without tripping react-refresh/only-export-components — see
// status-shared-client.jsx for the two components (StatusDot, RangeSelector)
// that DO need JSX and therefore live in their own file.
import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    MoonIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

// Task 16: the range picker's presets, each a whole-day span ending "today".
export const RANGE_PRESETS = [
    { id: '24h', days: 1, labelId: 'status.range.24h', label: '24h' },
    { id: '7d', days: 7, labelId: 'status.range.7d', label: '7d' },
    { id: '30d', days: 30, labelId: 'status.range.30d', label: '30d' },
    { id: '90d', days: 90, labelId: 'status.range.90d', label: '90d' },
    { id: '1y', days: 365, labelId: 'status.range.1y', label: '1y' },
];

// Exactly the server's own floor (status-handlers.js#parseRangeQuery,
// MIN_FROM_MS = 2000-01-01). Using the floor itself rather than one day
// earlier means "Whole period" never trips the server's exclusive `<` check,
// and Metrion simply has nothing before a monitor's first sample — those
// buckets render `no-data` (mapRangeBuckets), same honest treatment as any
// other gap, so there is no need to know each monitor's real earliest date.
export const WHOLE_PERIOD_FROM = '2000-01-01';
export const MIN_RANGE_DATE = '2000-01-01';

export const BADGE = {
    operational: { label: 'Operational', color: 'var(--live)', Icon: CheckCircleIcon },
    down: { label: 'Down', color: 'var(--down)', Icon: XCircleIcon },
    // Still responding, but more than 10% of the last 24h of checks failed.
    degraded: {
        label: 'Degraded',
        color: 'color-mix(in srgb, var(--live) 45%, var(--down))',
        Icon: ExclamationTriangleIcon,
    },
    pending: { label: 'Pending', color: 'var(--muted)', Icon: ExclamationTriangleIcon },
    // A healthy scale-to-zero app: still up, just resting. Distinct label, same green.
    idle: { label: 'Idle', color: 'var(--live)', Icon: MoonIcon },
};

// Extra context for statuses whose word alone invites the wrong reading — most
// importantly `idle`, which is healthy, not an outage. Surfaced as a `title`
// (mouse hover) on the badges below; screen-reader/keyboard users get the
// same explanation for free from MonitorMeta's permanent, non-hover text.
export const BADGE_HINT = {
    idle: 'Idle means healthy but scaled to zero — it wakes automatically on the next request, this is not an outage.',
};

// Discord-style severity tiers for a day's bar — the longer a service was down
// that day, the deeper the red, instead of a flat binary up/down.
export const SEVERITY = {
    operational: { label: 'Operational', bar: 'var(--live)', Icon: CheckCircleIcon },
    minor: {
        label: 'Minor outage',
        bar: 'color-mix(in srgb, var(--down) 45%, transparent)',
        Icon: ExclamationTriangleIcon,
    },
    major: {
        label: 'Partial outage',
        bar: 'color-mix(in srgb, var(--down) 70%, transparent)',
        Icon: ExclamationTriangleIcon,
    },
    critical: { label: 'Major outage', bar: 'var(--down)', Icon: XCircleIcon },
    'no-data': { label: 'No data', bar: 'var(--line)', Icon: ExclamationTriangleIcon },
};

export function fmtDate(ms) {
    return new Date(ms).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// Same as fmtDate but with a time — used for sub-daily bucket labels (a range
// request can come back hourly/minute-granular) and for incident timestamps,
// where "23 September 2026" alone would make every bucket that day look
// identical.
export function fmtDateTime(ms) {
    return new Date(ms).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Caps a number at `maxDecimals` places WITHOUT padding — `100` stays `100`,
// `99.9` stays `99.9`, only a genuinely long tail gets truncated
// (`99.97852003007196` -> `99.979`). Guards every percentage rendered on
// either status page against an unrounded value reaching the client at all:
// production was observed serving raw floats like `99.97852003007196` from
// `/api/status` before metrion-adapter.js's own round1 fix (commit 004fa58)
// reaches production — this is the defensive, presentation-layer backstop
// that holds regardless of what precision the server ever sends.
export function formatMaxDecimals(n, maxDecimals = 3) {
    const factor = 10 ** maxDecimals;
    return Math.round(n * factor) / factor;
}

export function fmtDuration(ms) {
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours && minutes) return `${hours} hrs ${minutes} mins`;
    if (hours) return `${hours} hrs`;
    return `${minutes} mins`;
}

// ---- Date-range picker helpers (Task 16) ---------------------------------
//
// The picker is built on native <input type="date">, which only carries a
// date, no time-of-day, and the URL mirrors that (`?from=YYYY-MM-DD&to=...`)
// for a shareable link. So every range here — presets included — is a whole
// UTC-day span: "from" is start-of-day UTC, "to" is end-of-day UTC (capped at
// "now" so a `to` of today never asks the server for a moment in the future;
// see parseRangeQuery's FUTURE_SLACK_MS on the server).
//
// ponytail: presets round to whole UTC days rather than a rolling instant
// (e.g. "24h" is "today and yesterday, UTC", not a strict trailing 24h) — one
// time semantic for both presets and the custom picker instead of two.
// Upgrade to precise instants if a user asks for tighter precision; that
// needs the URL to carry a time component too.

export function isoDateUTC(date) {
    return date.toISOString().slice(0, 10);
}

export function addDaysUTC(dateStr, deltaDays) {
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + deltaDays);
    return isoDateUTC(d);
}

export function todayUTC() {
    return isoDateUTC(new Date());
}

export function presetDateRange(days) {
    const to = todayUTC();
    return { from: addDaysUTC(to, -days), to };
}

export function isValidDateStr(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

// Which preset (if any) a from/to pair represents *right now*. A "7d" link
// bookmarked yesterday and opened today no longer covers the last 7 days, so
// it correctly reads as `custom` — the literal dates still load exactly as
// bookmarked, but the preset highlight only lights up when it is still true.
export function matchPreset(from, to) {
    const today = todayUTC();
    if (to !== today) return 'custom';
    if (from === WHOLE_PERIOD_FROM) return 'all';
    const found = RANGE_PRESETS.find((p) => addDaysUTC(today, -p.days) === from);
    return found ? found.id : 'custom';
}

export function parseRangeFromLocation() {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const to = params.get('to');
    if (!isValidDateStr(from) || !isValidDateStr(to)) return null;
    return { from, to };
}

// Date-only URL/state -> full ISO instants for the actual API call.
//
// The "now" cap is floored to the minute so repeated calls within the same
// 60s window share one `from:to` cache key — status-handlers' 10s report
// cache and metrion-adapter's RANGE_CACHE_MS=60s range cache are both keyed
// on the exact string, and an unrounded `Date.now()` produces a distinct
// key on every single call (millisecond precision), forcing a full report
// rebuild and a fresh outbound Metrion fetch on every page view/refresh
// instead of at most one per minute. Same rule fetchIdleLatencyOverlay
// already follows in metrion-adapter.js.
export function toApiRange({ from, to }) {
    const toMs = Math.min(
        Date.parse(`${to}T23:59:59.999Z`),
        Math.floor(Date.now() / 60_000) * 60_000,
    );
    return { from: `${from}T00:00:00.000Z`, to: new Date(toMs).toISOString() };
}

export const inputCls =
    'mt-2 w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]';
export const labelCls =
    'block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]';

// All range-picker state (URL sync, back/forward, custom-form validation) in
// one place — StatusPage and IncidentsPage both need the identical mechanics,
// only what a `null` rangeParam *means* differs (StatusPage: "current/live";
// IncidentsPage: "fall back to its own default window"), and that's decided
// by each page's own render/fetch code, not here.
export function useRangeState() {
    const intl = useIntl();
    const [rangeParam, setRangeParam] = useState(() => parseRangeFromLocation());
    const [rangeError, setRangeError] = useState('');
    const [customOpen, setCustomOpen] = useState(false);
    const [draftFrom, setDraftFrom] = useState(rangeParam?.from ?? '');
    const [draftTo, setDraftTo] = useState(rangeParam?.to ?? '');
    const [fromError, setFromError] = useState('');
    const [toError, setToError] = useState('');

    // Back/forward navigation must update the view — the only way either page
    // (no router, see status-main.jsx) hears about a history navigation.
    useEffect(() => {
        function onPopState() {
            const next = parseRangeFromLocation();
            setRangeParam(next);
            setDraftFrom(next?.from ?? '');
            setDraftTo(next?.to ?? '');
            setFromError('');
            setToError('');
        }
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    // Pushes a new history entry (not replace: back/forward must step through
    // ranges) and mirrors it into the date-only `?from=&to=` URL. `next: null`
    // returns to the default view and strips both params entirely, so the
    // very first load with no params is untouched.
    const applyRange = useCallback((next) => {
        setRangeError('');
        setRangeParam(next);
        const url = new URL(window.location.href);
        if (next) {
            url.searchParams.set('from', next.from);
            url.searchParams.set('to', next.to);
        } else {
            url.searchParams.delete('from');
            url.searchParams.delete('to');
        }
        window.history.pushState(null, '', url);
    }, []);

    function handlePreset(id) {
        setCustomOpen(false);
        if (id === 'default') return applyRange(null);
        if (id === 'all') return applyRange({ from: WHOLE_PERIOD_FROM, to: todayUTC() });
        const preset = RANGE_PRESETS.find((p) => p.id === id);
        if (preset) applyRange(presetDateRange(preset.days));
    }

    function handleToggleCustom() {
        setCustomOpen((open) => {
            const next = !open;
            // Opening fresh (no range picked yet): seed the two required
            // inputs with a sensible window instead of leaving them empty.
            if (next && !rangeParam) {
                const seed = presetDateRange(7);
                setDraftFrom(seed.from);
                setDraftTo(seed.to);
            }
            return next;
        });
    }

    // Shared by blur (per-field) and submit (both fields) validation, so the
    // two paths can never disagree about what "valid" means.
    function validateField(value) {
        if (!value) {
            return intl.formatMessage({
                id: 'status.range.error.required',
                defaultMessage: 'This date is required.',
            });
        }
        if (value < MIN_RANGE_DATE) {
            return intl.formatMessage({
                id: 'status.range.error.tooEarly',
                defaultMessage: 'Date must not be before 1 January 2000.',
            });
        }
        if (value > todayUTC()) {
            return intl.formatMessage({
                id: 'status.range.error.future',
                defaultMessage: 'Date must not be in the future.',
            });
        }
        return '';
    }

    function validateOrder(from, to) {
        if (from && to && to < from) {
            return intl.formatMessage({
                id: 'status.range.error.order',
                defaultMessage: 'End date must be on or after the start date.',
            });
        }
        return '';
    }

    function handleFromBlur() {
        setFromError(validateField(draftFrom));
    }

    function handleToBlur() {
        setToError(validateField(draftTo) || validateOrder(draftFrom, draftTo));
    }

    function handleApplyCustom(event) {
        event.preventDefault();
        const fErr = validateField(draftFrom);
        const tErr = validateField(draftTo) || validateOrder(draftFrom, draftTo);
        setFromError(fErr);
        setToError(tErr);
        if (fErr || tErr) return;
        setCustomOpen(false);
        applyRange({ from: draftFrom, to: draftTo });
    }

    const activePreset = rangeParam ? matchPreset(rangeParam.from, rangeParam.to) : 'default';

    return {
        rangeParam,
        activePreset,
        rangeError,
        setRangeError,
        customOpen,
        draftFrom,
        draftTo,
        setDraftFrom,
        setDraftTo,
        fromError,
        toError,
        applyRange,
        handlePreset,
        handleToggleCustom,
        handleFromBlur,
        handleToBlur,
        handleApplyCustom,
    };
}
