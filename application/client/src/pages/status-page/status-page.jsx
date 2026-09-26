import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
    ArrowLeftIcon,
    ArrowPathIcon,
    ArrowTopRightOnSquareIcon,
    CalendarIcon,
    CheckCircleIcon,
    CircleStackIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    MoonIcon,
    PencilSquareIcon,
    PlusIcon,
    ServerIcon,
    TrashIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { authHeaders, isAdmin } from '../../utils/auth.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

const POLL_MS = 15000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Task 16: the range picker's presets, each a whole-day span ending "today".
const RANGE_PRESETS = [
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
const WHOLE_PERIOD_FROM = '2000-01-01';
const MIN_RANGE_DATE = '2000-01-01';

// How many incidents to render inline before folding the rest into "+N more".
const INCIDENT_DISPLAY_CAP = 5;

const BADGE = {
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
const BADGE_HINT = {
    idle: 'Idle means healthy but scaled to zero — it wakes automatically on the next request, this is not an outage.',
};

// Discord-style severity tiers for a day's bar — the longer a service was down
// that day, the deeper the red, instead of a flat binary up/down.
const SEVERITY = {
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

function round1(n) {
    return Math.round(n * 10) / 10;
}

function fmtRelative(at) {
    if (!at) return 'never';
    const seconds = Math.round((Date.now() - at) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
}

function fmtDate(ms) {
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
function fmtDateTime(ms) {
    return new Date(ms).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function fmtRangeSpan(range) {
    return `${fmtDate(Date.parse(`${range.from}T00:00:00.000Z`))} – ${fmtDate(Date.parse(`${range.to}T00:00:00.000Z`))}`;
}

function fmtDuration(ms) {
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours && minutes) return `${hours} hrs ${minutes} mins`;
    if (hours) return `${hours} hrs`;
    return `${minutes} mins`;
}

function summarizeHistory(history, subDaily = false) {
    const known = history.filter((day) => day.severity !== 'no-data');
    if (!known.length) return 'No uptime data yet';
    const badDays = known.filter((day) => day.severity !== 'operational').length;
    const unit = subDaily ? 'periods' : 'days';
    return `${known.length - badDays} of ${known.length} ${unit} fully operational`;
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

function isoDateUTC(date) {
    return date.toISOString().slice(0, 10);
}

function addDaysUTC(dateStr, deltaDays) {
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + deltaDays);
    return isoDateUTC(d);
}

function todayUTC() {
    return isoDateUTC(new Date());
}

function presetDateRange(days) {
    const to = todayUTC();
    return { from: addDaysUTC(to, -days), to };
}

function isValidDateStr(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

// Which preset (if any) a from/to pair represents *right now*. A "7d" link
// bookmarked yesterday and opened today no longer covers the last 7 days, so
// it correctly reads as `custom` — the literal dates still load exactly as
// bookmarked, but the preset highlight only lights up when it is still true.
function matchPreset(from, to) {
    const today = todayUTC();
    if (to !== today) return 'custom';
    if (from === WHOLE_PERIOD_FROM) return 'all';
    const found = RANGE_PRESETS.find((p) => addDaysUTC(today, -p.days) === from);
    return found ? found.id : 'custom';
}

function parseRangeFromLocation() {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const to = params.get('to');
    if (!isValidDateStr(from) || !isValidDateStr(to)) return null;
    return { from, to };
}

// Date-only URL/state -> full ISO instants for the actual API call.
function toApiRange({ from, to }) {
    const toMs = Math.min(Date.parse(`${to}T23:59:59.999Z`), Date.now());
    return { from: `${from}T00:00:00.000Z`, to: new Date(toMs).toISOString() };
}

// A window with no checks in it has a null uptime — unknown, which reads muted
// and prints as a dash rather than a confident "0%".
function uptimeColor(pct) {
    if (pct == null) return 'var(--muted)';
    if (pct >= 99.9) return 'var(--live)';
    if (pct >= 99) return '#c98a1a';
    return 'var(--down)';
}

function fmtUptime(pct) {
    return pct == null ? '—' : `${pct}%`;
}

// Metrion entries are new to this page and share no history with the "—"
// convention Mongo's pending monitors already trained users on, so a null
// value here spells out "no data" instead of reusing a dash that could be
// misread as a stale value rather than an absent one. Mongo-sourced null
// uptime keeps the existing dash — unchanged, per scope.
function UptimeValue({ pct, source }) {
    if (pct != null) return `${pct}%`;
    if (source === 'metrion') {
        return <FormattedMessage id="status.uptime.noData" defaultMessage="no data" />;
    }
    return '—';
}

// A monitor's status word, in systems terms: a healthy scale-to-zero app reads
// "idle", not "down".
function displayStatus(monitor) {
    if (monitor.status === 'operational' && monitor.runningStatus === 'ScaledToZero') return 'idle';
    return monitor.status;
}

// Live dot: pulses when up, solid when idle (at rest) or down.
function StatusDot({ status, size = 'sm' }) {
    const dim = size === 'lg' ? 'h-3 w-3' : 'h-2 w-2';

    if (status === 'down') {
        return (
            <span
                className={`inline-flex shrink-0 ${dim} rounded-full`}
                style={{ background: 'var(--down)' }}
            />
        );
    }
    if (status === 'idle') {
        // A hollow ring, not a filled dot: healthy but at rest. Reads as the
        // outline of "operational" rather than a dimmer copy of it — a scaled
        // to-zero app is up, just not doing anything.
        return (
            <span
                className={`inline-flex shrink-0 ${dim} rounded-full border`}
                style={{
                    borderColor: 'var(--live)',
                    background: 'color-mix(in srgb, var(--live) 15%, transparent)',
                }}
            />
        );
    }

    const color = BADGE[status]?.color ?? 'var(--muted)';
    return (
        <span className={`relative inline-flex shrink-0 ${dim}`}>
            <span
                className="absolute inline-flex h-full w-full rounded-full opacity-70 motion-safe:animate-ping"
                style={{ background: color }}
            />
            <span
                className={`relative inline-flex ${dim} rounded-full`}
                style={{ background: color }}
            />
        </span>
    );
}

// One day's bar with a hover/focus popover: date, severity, and downtime that
// day. Focusable so keyboard users can inspect individual days the same way a
// mouse hover does; the tooltip shows on focus as well as hover.
function DayBar({ day, index = 0, total = 90, subDaily = false }) {
    const info = SEVERITY[day.severity] ?? SEVERITY['no-data'];
    const label = day.downMs > 0 ? `${info.label}, ${fmtDuration(day.downMs)} down` : info.label;
    // A range request can come back hourly/minute-granular (server auto-picks
    // bucket width to stay under 2000 buckets) — the date-only label reads as
    // a bug when several consecutive bars share one calendar day, so
    // sub-daily buckets get a time on the tooltip too.
    const dateLabel = subDaily ? fmtDateTime(day.day) : fmtDate(day.day);

    // A centred w-60 popover overhangs the container on the first and last few
    // bars; pin those to the bar's edge so the tooltip stays on-screen.
    const anchor =
        index < 4 ? 'left-0' : index >= total - 4 ? 'right-0' : 'left-1/2 -translate-x-1/2';

    return (
        <div
            role="img"
            tabIndex={0}
            aria-label={`${dateLabel}: ${label}`}
            className="group/bar relative flex-1 rounded-[2px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
            <div className="h-7 rounded-[2px] transition-colors" style={{ background: info.bar }} />

            <div
                className={`pointer-events-none absolute bottom-full z-20 mb-2 w-60 max-w-[80vw] opacity-0 transition-opacity duration-150 group-hover/bar:opacity-100 group-focus/bar:opacity-100 ${anchor}`}
            >
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 shadow-lg">
                    <p className="text-xs font-semibold text-[var(--text)]">{dateLabel}</p>

                    <div className="mt-2 flex items-center gap-2 rounded-md border border-[var(--line)] px-2.5 py-1.5">
                        <info.Icon className="h-4 w-4 shrink-0" style={{ color: info.bar }} />
                        <span className="text-xs font-medium text-[var(--text)]">{info.label}</span>
                        {day.downMs > 0 && (
                            <span className="ml-auto shrink-0 font-mono text-2xs text-[var(--muted)]">
                                {fmtDuration(day.downMs)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1.5 rotate-45 border-b border-r border-[var(--line)] bg-[var(--surface)]" />
            </div>
        </div>
    );
}

function UptimeBar({ history, subDaily = false }) {
    // The summary lives in an sr-only caption so screen readers get the gist in
    // one stop instead of being forced through every day's bar; the focusable
    // bars below carry the per-day detail.
    return (
        <figure className="m-0">
            <figcaption className="sr-only">{summarizeHistory(history, subDaily)}</figcaption>
            <div className="flex h-7 items-stretch gap-[2px]">
                {history.map((day, index) => (
                    <DayBar
                        key={index}
                        day={day}
                        index={index}
                        total={history.length}
                        subDaily={subDaily}
                    />
                ))}
            </div>
        </figure>
    );
}

function UptimeLegend({ subDaily = false }) {
    const items = [
        ['operational', SEVERITY.operational.bar],
        ['minor ≥0.5%', SEVERITY.minor.bar],
        ['major ≥5%', SEVERITY.major.bar],
        ['critical ≥20%', SEVERITY.critical.bar],
        ['no data', SEVERITY['no-data'].bar],
    ];
    return (
        <div
            className="hidden flex-wrap items-center justify-end gap-x-3 gap-y-1 font-mono text-2xs text-[var(--muted)] sm:flex"
            title={`Share of ${subDaily ? 'a bucket' : 'a day'} the service was down; matches the server's severityFor bands`}
        >
            {items.map(([label, bar]) => (
                <span key={label} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: bar }} /> {label}
                </span>
            ))}
        </div>
    );
}

function StatTile({ label, value, Icon, hint }) {
    return (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-1.5 text-[var(--muted)]">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-medium">{label}</p>
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-[var(--text)]">{value}</p>
            {hint && <p className="mt-1 font-mono text-xs text-[var(--muted)]">{hint}</p>}
        </div>
    );
}

function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Range-mode only: a compact list of down periods for the selected window.
// `incidents` may itself already be server-truncated; `totalIncidents` is the
// true count regardless, so the "+N more" figure is always honest even when
// this component's own INCIDENT_DISPLAY_CAP is smaller than what the server sent.
function IncidentList({ incidents, totalIncidents }) {
    if (!incidents?.length) return null;

    const shown = incidents.slice(0, INCIDENT_DISPLAY_CAP);
    const knownTotal = totalIncidents ?? incidents.length;
    const hiddenCount = Math.max(knownTotal - shown.length, 0);

    return (
        <div className="mt-2 rounded-md border border-[var(--line)] px-3 py-2">
            <p className="font-mono text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                <FormattedMessage
                    id="status.incidents.heading"
                    defaultMessage="Incidents in this period"
                />
            </p>
            <ul className="mt-1.5 space-y-1">
                {shown.map((inc, index) => (
                    <li
                        key={index}
                        className="flex flex-wrap items-baseline gap-x-2 font-mono text-2xs text-[var(--text)]"
                    >
                        <span>{fmtDateTime(Date.parse(inc.startedAt))}</span>
                        <span className="text-[var(--muted)]">→</span>
                        <span style={!inc.endedAt ? { color: 'var(--down)' } : undefined}>
                            {inc.endedAt ? (
                                fmtDateTime(Date.parse(inc.endedAt))
                            ) : (
                                <FormattedMessage
                                    id="status.incidents.ongoing"
                                    defaultMessage="ongoing"
                                />
                            )}
                        </span>
                        <span className="text-[var(--muted)]">
                            · {fmtDuration(inc.durationSeconds * 1000)}
                        </span>
                    </li>
                ))}
            </ul>
            {hiddenCount > 0 && (
                <p className="mt-1.5 font-mono text-2xs text-[var(--muted)]">
                    <FormattedMessage
                        id="status.incidents.more"
                        defaultMessage="+{count} more"
                        values={{ count: hiddenCount }}
                    />
                </p>
            )}
        </div>
    );
}

function OverallBanner({ report, upCount, total, error, onRetry }) {
    if (!report && error) {
        return (
            <div
                className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border p-5"
                style={{
                    borderColor: `color-mix(in srgb, var(--down) 35%, var(--line))`,
                    background: `color-mix(in srgb, var(--down) 8%, var(--surface))`,
                }}
            >
                <span className="h-3 w-3 shrink-0 rounded-full bg-[var(--down)]" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text)]">
                        Couldn&apos;t load the status report
                    </p>
                    <p className="font-mono text-xs text-[var(--muted)]">
                        The status service didn&apos;t respond. Retrying automatically.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                    <ArrowPathIcon className="h-4 w-4" /> Try again
                </button>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="mb-6 flex animate-pulse items-center gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5">
                <span className="h-3 w-3 shrink-0 rounded-full bg-[var(--line)]" />
                <p className="font-mono text-sm text-[var(--muted)]">
                    Connecting to status service…
                </p>
            </div>
        );
    }

    const allOperational = report.status === 'operational' || report.status === 'idle';
    const label = allOperational
        ? 'All systems operational'
        : report.status === 'degraded'
          ? 'Degraded performance'
          : report.status === 'pending'
            ? 'Awaiting first checks'
            : upCount === 0 && total > 0
              ? 'Major outage'
              : 'Partial outage';
    const tint = allOperational
        ? 'var(--live)'
        : report.status === 'degraded'
          ? BADGE.degraded.color
          : report.status === 'pending'
            ? 'var(--muted)'
            : 'var(--down)';

    return (
        <div className="mb-6">
            <div
                className="flex items-center gap-4 rounded-lg border p-5"
                style={{
                    borderColor: `color-mix(in srgb, ${tint} 35%, var(--line))`,
                    background: `color-mix(in srgb, ${tint} 8%, var(--surface))`,
                }}
            >
                <StatusDot status={report.status} size="lg" />
                <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-[var(--text)]">{label}</p>
                    <p className="font-mono text-xs text-[var(--muted)]">
                        checks every {Math.round(report.checkIntervalMs / 1000)}s
                    </p>
                </div>
            </div>

            {/* A background poll failed, but the last known report is still shown
                above rather than blanked — this note says so instead of leaving the
                user to wonder whether what they're looking at is current. */}
            {error && (
                <div className="mt-2 flex flex-wrap items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 py-2 font-mono text-xs text-[var(--muted)]">
                    <ExclamationTriangleIcon
                        className="h-4 w-4 shrink-0"
                        style={{ color: 'var(--down)' }}
                    />
                    <span>Last update failed — showing the most recently known status.</span>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="ml-auto inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-[var(--line)] px-2.5 py-1 font-semibold text-[var(--text)] transition hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                        <ArrowPathIcon className="h-3.5 w-3.5" /> Retry
                    </button>
                </div>
            )}
        </div>
    );
}

// Task 15's stale/staleSince flag, surfaced. Distinct from OverallBanner's own
// error note above: that one fires when a background POLL just failed and the
// prior report is shown as a fallback; this one fires when the REPORT ITSELF
// (however it got here — including a fresh, successful poll) is Metrion's
// last-known-good snapshot because the live feed hasn't answered recently.
// Muted tone, not the alarming red of an outage — the data may well still be
// "operational", just not confirmed as of right now.
function StaleNote({ staleSince }) {
    return (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 py-2 font-mono text-xs text-[var(--muted)]">
            <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
            <span>
                <FormattedMessage
                    id="status.stale.note"
                    defaultMessage="Showing the last known data — the live feed hasn't answered since {since}."
                    values={{
                        since: staleSince ? fmtRelative(Date.parse(staleSince)) : 'a while ago',
                    }}
                />
            </span>
        </div>
    );
}

// The subtitle line under a monitor name. Container-app monitors read
// "Azure Container App", plus the URL if one exists, plus a scale-to-zero note.
function MonitorMeta({ monitor }) {
    const linkCls =
        'inline-flex min-w-0 max-w-full items-center gap-1 font-mono text-xs text-[var(--muted)] transition hover:text-[var(--accent)]';

    if (monitor.containerApp) {
        const scaled = monitor.runningStatus === 'ScaledToZero';
        return (
            <p className="truncate font-mono text-xs text-[var(--muted)]">
                Azure Container App
                {monitor.url && (
                    <>
                        {' · '}
                        <a
                            href={monitor.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline-offset-2 hover:text-[var(--accent)] hover:underline"
                        >
                            {monitor.url.replace(/^https?:\/\//, '')}
                        </a>
                    </>
                )}
                {scaled && ' · Idle — scaled to zero, wakes automatically on the next request'}
            </p>
        );
    }

    if (monitor.url) {
        return (
            <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group ${linkCls}`}
            >
                <span className="truncate underline-offset-2 group-hover:underline">
                    {monitor.url.replace(/^https?:\/\//, '')}
                </span>
                <ArrowTopRightOnSquareIcon className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-100" />
            </a>
        );
    }

    // Metrion entries have neither a URL nor a Container App to describe, so
    // this slot — otherwise empty — carries the quiet source marker instead:
    // the same text-only treatment "Azure Container App" already uses above,
    // not a new badge component invented for one purpose.
    if (monitor.source === 'metrion') {
        return (
            <p className="flex items-center gap-1 truncate font-mono text-xs text-[var(--muted)]">
                <CircleStackIcon className="h-3 w-3 shrink-0" />
                <FormattedMessage id="status.source.metrion" defaultMessage="via Metrion" />
            </p>
        );
    }

    return null;
}

function MonitorRow({
    monitor,
    admin,
    onEdit,
    onDelete,
    nested = false,
    rangeActive = false,
    subDaily = false,
}) {
    const status = displayStatus(monitor);
    const badge = BADGE[status] ?? BADGE.pending;
    const rowTitle =
        monitor.status === 'down'
            ? monitor.lastError || 'Down — no further error details available'
            : undefined;

    return (
        <div
            className={`border-b border-[var(--line)] ${nested ? 'py-3' : 'py-5'} last:border-0`}
            title={rowTitle}
        >
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <StatusDot status={status} />

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text)]">
                            {monitor.name}
                        </p>
                        <MonitorMeta monitor={monitor} />
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {monitor.latencyMs != null && (
                        <span className="font-mono text-xs text-[var(--muted)]">
                            {monitor.latencyMs}ms
                        </span>
                    )}

                    <span
                        className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: badge.color }}
                        title={BADGE_HINT[status]}
                    >
                        <badge.Icon className="h-4 w-4" /> {badge.label}
                    </span>

                    {admin && (
                        <>
                            <button
                                type="button"
                                onClick={() => onEdit(monitor)}
                                aria-label={`Edit ${monitor.name}`}
                                title="Edit"
                                className="cursor-pointer rounded-md p-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(monitor)}
                                aria-label={`Remove ${monitor.name}`}
                                title="Remove"
                                className="cursor-pointer rounded-md p-1.5 text-[var(--muted)] transition hover:text-[var(--down)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <UptimeBar history={monitor.history} subDaily={subDaily} />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-2xs">
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {rangeActive && monitor.uptime.range != null && (
                        <span style={{ color: uptimeColor(monitor.uptime.range) }}>
                            {fmtUptime(monitor.uptime.range)} ·{' '}
                            <FormattedMessage
                                id="status.range.periodLabel"
                                defaultMessage="period"
                            />
                        </span>
                    )}
                    <span style={{ color: uptimeColor(monitor.uptime.d30) }}>
                        <UptimeValue pct={monitor.uptime.d30} source={monitor.source} /> · 30d
                    </span>
                    <span style={{ color: uptimeColor(monitor.uptime.d7) }}>
                        <UptimeValue pct={monitor.uptime.d7} source={monitor.source} /> · 7d
                    </span>
                    <span style={{ color: uptimeColor(monitor.uptime.h24) }}>
                        <UptimeValue pct={monitor.uptime.h24} source={monitor.source} /> · 24h
                    </span>
                </span>
                <span className="flex items-center gap-1.5 text-[var(--muted)]">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {monitor.status === 'pending'
                        ? 'Checking…'
                        : `checked ${fmtRelative(monitor.lastCheckedAt)}`}
                </span>
            </div>

            {/* Range-window latency (p50/p95), distinct from the live latencyMs
                pill above — only present when a range request actually reached
                Metrion's /uptime/range for this monitor (metrion-adapter.js). */}
            {rangeActive && monitor.latency?.p50 != null && (
                <p className="mt-1 font-mono text-2xs text-[var(--muted)]">
                    {monitor.latency.p95 != null ? (
                        <FormattedMessage
                            id="status.range.periodLatencyBoth"
                            defaultMessage="{p50}ms p50 · {p95}ms p95 for this period"
                            values={{ p50: monitor.latency.p50, p95: monitor.latency.p95 }}
                        />
                    ) : (
                        <FormattedMessage
                            id="status.range.periodLatencyP50"
                            defaultMessage="{p50}ms p50 for this period"
                            values={{ p50: monitor.latency.p50 }}
                        />
                    )}
                </p>
            )}

            {rangeActive && (
                <IncidentList
                    incidents={monitor.incidents}
                    totalIncidents={monitor.totalIncidents}
                />
            )}

            {monitor.status === 'down' && monitor.lastError && (
                <p
                    title={monitor.lastError}
                    className="mt-2 truncate rounded-md px-3 py-2 font-mono text-2xs"
                    style={{
                        background: 'color-mix(in srgb, var(--down) 10%, transparent)',
                        color: 'var(--down)',
                    }}
                >
                    {monitor.lastError}
                </p>
            )}

            {/* Where a Mongo-sourced row would show its red error line, a
                down Metrion entry has none to show — Metrion's numeric-only
                envelope carries no statusCode/error/runningStatus (ADR 0007
                §3). Left blank that reads as a rendering bug; this names the
                absence instead, in the page's existing quiet-note register
                rather than the alarming red used for an actual error. */}
            {monitor.source === 'metrion' && monitor.status === 'down' && (
                <p className="mt-2 rounded-md border border-dashed border-[var(--line)] px-3 py-2 font-mono text-2xs text-[var(--muted)]">
                    <FormattedMessage
                        id="status.metrion.noDetail"
                        defaultMessage="Metrion reports uptime only — no incident detail is available for this service."
                    />
                </p>
            )}
        </div>
    );
}

function MonitorSkeleton() {
    return (
        <div className="animate-pulse border-b border-[var(--line)] py-5 last:border-0">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="h-4 w-40 rounded bg-[var(--surface-2)]" />
                <div className="h-4 w-14 rounded bg-[var(--surface-2)]" />
            </div>
            <div className="h-7 rounded bg-[var(--surface-2)]" />
        </div>
    );
}

const inputCls =
    'mt-2 w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]';
const labelCls = 'block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]';

function MonitorForm({ editing, existingGroups, onSubmit, onCancel }) {
    const [name, setName] = useState(editing?.name ?? '');
    const [url, setUrl] = useState(editing?.url ?? '');
    const [group, setGroup] = useState(editing?.group ?? '');
    const [metrionKey, setMetrionKey] = useState(editing?.metrionKey ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isContainerApp = Boolean(editing?.containerApp);

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');

        if (!name.trim() || (!url.trim() && !isContainerApp)) {
            setError('Name and URL are required.');
            return;
        }

        if (!metrionKey.trim()) {
            setError('Metrion key is required.');
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit({
                name: name.trim(),
                url: url.trim(),
                group: group.trim(),
                metrionKey: metrionKey.trim(),
            });
            if (!editing) {
                setName('');
                setUrl('');
                setGroup('');
                setMetrionKey('');
            }
        } catch (err) {
            setError(err.message || 'Failed to save monitor.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form
            id={editing ? undefined : 'monitor-form'}
            onSubmit={handleSubmit}
            className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] p-4"
        >
            <p className="basis-full font-mono text-2xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Admin · {editing ? 'Edit monitor' : 'Add monitor'}
            </p>

            {isContainerApp && (
                <p className="basis-full font-mono text-2xs text-[var(--muted)]">
                    Container App: {editing.containerApp.name} ({editing.containerApp.resourceGroup}
                    ) — status comes from Azure's control plane; it is never probed over HTTP. The
                    URL below is only a display link.
                </p>
            )}

            <label className="flex-1 basis-40">
                <span className={labelCls}>Name</span>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Website"
                    className={inputCls}
                />
            </label>

            <label className="flex-[2] basis-64">
                <span className={labelCls}>URL{isContainerApp ? ' (link only)' : ''}</span>
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={
                        isContainerApp
                            ? 'https://example.com (display link)'
                            : 'https://example.com'
                    }
                    className={`${inputCls} font-mono`}
                />
            </label>

            <label className="flex-1 basis-40">
                <span className={labelCls}>Group (optional)</span>
                <input
                    list="monitor-groups"
                    type="text"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    placeholder="e.g. ML Visualizer"
                    className={inputCls}
                />
                <datalist id="monitor-groups">
                    {existingGroups?.map((g) => (
                        <option key={g} value={g} />
                    ))}
                </datalist>
            </label>

            <label className="flex-1 basis-40">
                <span className={labelCls}>Metrion key</span>
                <input
                    type="text"
                    value={metrionKey}
                    onChange={(e) => setMetrionKey(e.target.value)}
                    placeholder="e.g. netviz"
                    className={`${inputCls} font-mono`}
                />
            </label>

            <div className="flex items-center gap-2">
                {editing && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex cursor-pointer items-center rounded-md border border-[var(--line)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]"
                    >
                        Cancel
                    </button>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--text)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <PlusIcon className="h-4 w-4" />
                    {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add monitor'}
                </button>
            </div>

            {error && <p className="w-full text-sm text-[var(--down)]">{error}</p>}
        </form>
    );
}

// A named group of monitors — summarized (averaged) uptime and worst-of status,
// with each member nested underneath.
function GroupSection({ group, admin, onEdit, onDelete, rangeActive = false, subDaily = false }) {
    const badge = BADGE[group.status] ?? BADGE.pending;

    return (
        <div className="border-b border-[var(--line)] py-5 last:border-0">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <StatusDot status={group.status} />
                    <p className="truncate text-sm font-semibold text-[var(--text)]">
                        {group.name}
                    </p>
                    <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-mono text-2xs font-medium text-[var(--muted)]">
                        {group.monitors.length} services
                    </span>
                </div>

                <span
                    className="flex shrink-0 items-center gap-1.5 text-xs font-medium"
                    style={{ color: badge.color }}
                    title={BADGE_HINT[group.status]}
                >
                    <badge.Icon className="h-4 w-4" /> {badge.label}
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-2xs">
                <span style={{ color: uptimeColor(group.uptime.d30) }}>
                    {fmtUptime(group.uptime.d30)} · 30d avg
                </span>
                <span style={{ color: uptimeColor(group.uptime.d7) }}>
                    {fmtUptime(group.uptime.d7)} · 7d avg
                </span>
                <span style={{ color: uptimeColor(group.uptime.h24) }}>
                    {fmtUptime(group.uptime.h24)} · 24h avg
                </span>
            </div>

            <div className="ml-2 mt-3 space-y-1 border-l border-[var(--line)] pl-4">
                {group.monitors.map((monitor) => (
                    <MonitorRow
                        key={monitor._id}
                        monitor={monitor}
                        admin={admin}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        rangeActive={rangeActive}
                        subDaily={subDaily}
                        nested
                    />
                ))}
            </div>
        </div>
    );
}

// The row of preset pills + the "Custom…" toggle that reveals two native
// date inputs. Presentational only — StatusPage owns the range state, URL
// sync, and validation; this just renders it and reports clicks/edits back up.
function RangeSelector({
    activePreset,
    onPreset,
    customOpen,
    onToggleCustom,
    draftFrom,
    draftTo,
    onDraftFromChange,
    onDraftToChange,
    onFromBlur,
    onToBlur,
    onApplyCustom,
    fromError,
    toError,
}) {
    const pillCls = (active) =>
        `cursor-pointer rounded-md border px-3 py-1.5 font-mono text-2xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
            active
                ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--text)]'
                : 'border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]'
        }`;

    return (
        <div className="mb-6">
            <div
                role="group"
                aria-label="Status date range"
                className="flex flex-wrap items-center gap-2"
            >
                <button
                    type="button"
                    aria-pressed={activePreset === 'default'}
                    onClick={() => onPreset('default')}
                    className={pillCls(activePreset === 'default')}
                >
                    <FormattedMessage id="status.range.live" defaultMessage="Current" />
                </button>

                {RANGE_PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        type="button"
                        aria-pressed={activePreset === preset.id}
                        onClick={() => onPreset(preset.id)}
                        className={pillCls(activePreset === preset.id)}
                    >
                        <FormattedMessage id={preset.labelId} defaultMessage={preset.label} />
                    </button>
                ))}

                <button
                    type="button"
                    aria-pressed={activePreset === 'all'}
                    onClick={() => onPreset('all')}
                    className={pillCls(activePreset === 'all')}
                >
                    <FormattedMessage id="status.range.all" defaultMessage="Whole period" />
                </button>

                <button
                    type="button"
                    aria-pressed={customOpen || activePreset === 'custom'}
                    aria-expanded={customOpen}
                    onClick={onToggleCustom}
                    className={`${pillCls(customOpen || activePreset === 'custom')} inline-flex items-center gap-1.5`}
                >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <FormattedMessage id="status.range.custom" defaultMessage="Custom…" />
                </button>
            </div>

            {customOpen && (
                <form
                    onSubmit={onApplyCustom}
                    className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface)] p-4"
                >
                    <label className="flex-1 basis-40">
                        <span className={labelCls}>
                            <FormattedMessage id="status.range.from" defaultMessage="From" />
                        </span>
                        <input
                            type="date"
                            value={draftFrom}
                            min={MIN_RANGE_DATE}
                            max={todayUTC()}
                            required
                            onChange={(e) => onDraftFromChange(e.target.value)}
                            onBlur={onFromBlur}
                            className={inputCls}
                        />
                        {fromError && (
                            <p className="mt-1 text-xs text-[var(--down)]">{fromError}</p>
                        )}
                    </label>

                    <label className="flex-1 basis-40">
                        <span className={labelCls}>
                            <FormattedMessage id="status.range.to" defaultMessage="To" />
                        </span>
                        <input
                            type="date"
                            value={draftTo}
                            min={MIN_RANGE_DATE}
                            max={todayUTC()}
                            required
                            onChange={(e) => onDraftToChange(e.target.value)}
                            onBlur={onToBlur}
                            className={inputCls}
                        />
                        {toError && <p className="mt-1 text-xs text-[var(--down)]">{toError}</p>}
                    </label>

                    <button
                        type="submit"
                        className="inline-flex cursor-pointer items-center rounded-md bg-[var(--text)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                        <FormattedMessage id="status.range.apply" defaultMessage="Apply" />
                    </button>
                </form>
            )}
        </div>
    );
}

export default function StatusPage() {
    usePageMeta('Status', 'Live uptime status for Woofi Developments and its monitored services.');
    const intl = useIntl();

    const [report, setReport] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [admin] = useState(() => isAdmin());
    const [editingMonitor, setEditingMonitor] = useState(null);

    // Task 16: the picker's selected range, `null` for the default "current"
    // view. Seeded from the URL on first render so a shared/bookmarked link
    // reproduces its range on load, before the first fetch even fires.
    const [rangeParam, setRangeParam] = useState(() => parseRangeFromLocation());
    const [rangeError, setRangeError] = useState('');
    const [customOpen, setCustomOpen] = useState(false);
    const [draftFrom, setDraftFrom] = useState(rangeParam?.from ?? '');
    const [draftTo, setDraftTo] = useState(rangeParam?.to ?? '');
    const [fromError, setFromError] = useState('');
    const [toError, setToError] = useState('');

    // Back/forward navigation must update the view — the only way this page
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

    const load = useCallback(() => {
        const url = new URL('/api/status', window.location.origin);
        if (rangeParam) {
            const apiRange = toApiRange(rangeParam);
            url.searchParams.set('from', apiRange.from);
            url.searchParams.set('to', apiRange.to);
        }

        return fetch(url, admin ? { headers: authHeaders() } : undefined)
            .then((response) => {
                if (response.ok) return response.json();
                // A bad range (from>to, a hand-edited URL, a link stale enough
                // to predate the server's own floor) is a validation problem
                // with the picker's input, not a service-down fetch crash —
                // it gets its own message next to the picker instead of the
                // generic "couldn't load" banner below.
                if (response.status === 400 && rangeParam) {
                    throw new Error('range');
                }
                return null;
            })
            .then((data) => {
                if (data) {
                    setReport(data);
                    setLoadError(false);
                    setRangeError('');
                } else if (data !== undefined) {
                    // A non-ok response is a failed load, not "no data".
                    setLoadError(true);
                }
            })
            .catch((err) => {
                if (err?.message === 'range') {
                    setRangeError(
                        intl.formatMessage({
                            id: 'status.range.error.invalid',
                            defaultMessage:
                                'This date range could not be loaded — pick a different one.',
                        }),
                    );
                    return;
                }
                // A failed poll keeps the last known report on screen; the error
                // state below only renders when there is nothing to fall back on,
                // so this stays silent for a stale-but-there report.
                setLoadError(true);
            });
    }, [admin, rangeParam, intl]);

    useEffect(() => {
        let active = true;
        load();
        const interval = setInterval(() => {
            if (active) load();
        }, POLL_MS);
        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [load]);

    async function handleRefresh() {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }

    async function handleCreate({ name, url, group, metrionKey }) {
        const response = await fetch('/api/monitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ name, url, group, metrionKey }),
        });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message || 'Failed to add monitor.');
        }
        await load();
    }

    async function handleUpdate(monitor, { name, url, group, metrionKey }) {
        const response = await fetch(`/api/monitors/${monitor._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ name, url, group, metrionKey }),
        });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message || 'Failed to update monitor.');
        }
        setEditingMonitor(null);
        await load();
    }

    async function handleDelete(monitor) {
        const confirmed = window.confirm(`Remove "${monitor.name}" from monitoring?`);
        if (!confirmed) return;

        const response = await fetch(`/api/monitors/${monitor._id}`, {
            method: 'DELETE',
            headers: { ...authHeaders() },
        });
        if (!response.ok && response.status !== 204) {
            window.alert('Failed to remove monitor.');
            return;
        }
        setEditingMonitor((current) => (current?._id === monitor._id ? null : current));
        await load();
    }

    const groups = report?.groups ?? [];
    const ungrouped = report?.ungrouped ?? [];
    const monitors = [...groups.flatMap((g) => g.monitors), ...ungrouped];
    const existingGroups = groups.map((g) => g.name);
    // Only claim two data sources when Metrion actually contributed an entry —
    // with METRION_STATUS_URL unset, mergeWithMetrion returns Mongo entries
    // only, and naming a source that isn't present would be its own gap.
    const hasMetrion = monitors.some((m) => m.source === 'metrion');

    const upCount = monitors.filter(
        (m) => m.status === 'operational' || m.status === 'idle',
    ).length;
    const known30d = monitors.map((m) => m.uptime.d30).filter((pct) => pct != null);
    const avgUptime = known30d.length
        ? round1(known30d.reduce((sum, pct) => sum + pct, 0) / known30d.length)
        : null;
    // Median of the per-monitor 24 h p50s, not a mean: one slow outlier used to
    // drag the old mean of latest samples from ~400 ms to ~970 ms. p95 shows the
    // worst monitor's p95, so it is labelled as such. Monitors without `latency`
    // (Metrion-sourced, or an API that predates the field) sit out.
    const latencyStats = monitors.map((m) => m.latency).filter((l) => l?.p50 != null);
    const p50 = latencyStats.length ? Math.round(median(latencyStats.map((l) => l.p50))) : null;
    const worstP95 = latencyStats.some((l) => l.p95 != null)
        ? Math.round(Math.max(...latencyStats.map((l) => l.p95).filter((v) => v != null)))
        : null;

    // A picked range only actually changes what's rendered when the source
    // supports it — `rangeUnsupported` means the server quietly served the
    // default report instead, and monitors carry no `.uptime.range`/`.latency`
    // /`.incidents` in that case, so period-specific UI stays off.
    const activePreset = rangeParam ? matchPreset(rangeParam.from, rangeParam.to) : 'default';
    const rangeActive = Boolean(rangeParam) && !report?.rangeUnsupported;
    // Bucket width from the server's own `range` metadata (buckets are evenly
    // spaced across [from, to)) — under a day means the history bars are
    // hourly/minute-granular and need a time on their labels, not just a date.
    const subDaily =
        rangeActive && report?.range?.bucketCount > 0
            ? (Date.parse(report.range.to) - Date.parse(report.range.from)) /
                  report.range.bucketCount <
              DAY_MS
            : false;

    const periodUptimeValues = monitors.map((m) => m.uptime?.range).filter((pct) => pct != null);
    const periodAvgUptime = periodUptimeValues.length
        ? round1(periodUptimeValues.reduce((sum, pct) => sum + pct, 0) / periodUptimeValues.length)
        : null;

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
            <div className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
                <div className="mb-6 flex items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)]">
                        Status
                    </h1>

                    <div className="flex-1" />

                    <button
                        type="button"
                        onClick={handleRefresh}
                        aria-label="Refresh"
                        title="Refresh"
                        className="cursor-pointer rounded-md p-2 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <RangeSelector
                    activePreset={activePreset}
                    onPreset={handlePreset}
                    customOpen={customOpen}
                    onToggleCustom={handleToggleCustom}
                    draftFrom={draftFrom}
                    draftTo={draftTo}
                    onDraftFromChange={setDraftFrom}
                    onDraftToChange={setDraftTo}
                    onFromBlur={handleFromBlur}
                    onToBlur={handleToBlur}
                    onApplyCustom={handleApplyCustom}
                    fromError={fromError}
                    toError={toError}
                />

                {rangeError && (
                    <p
                        className="mb-6 flex items-center gap-2 rounded-md border px-4 py-2 font-mono text-xs"
                        style={{
                            borderColor: `color-mix(in srgb, var(--down) 35%, var(--line))`,
                            background: `color-mix(in srgb, var(--down) 8%, var(--surface))`,
                            color: 'var(--down)',
                        }}
                    >
                        <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                        {rangeError}
                    </p>
                )}

                {report?.rangeUnsupported && (
                    <p className="mb-6 flex items-center gap-2 rounded-md border border-dashed border-[var(--line)] px-3 py-2 font-mono text-2xs text-[var(--muted)]">
                        <CircleStackIcon className="h-3.5 w-3.5 shrink-0" />
                        <FormattedMessage
                            id="status.range.unsupported"
                            defaultMessage="Date ranges need the Metrion source — showing the default view instead."
                        />
                    </p>
                )}

                {report?.stale && <StaleNote staleSince={report.staleSince} />}

                <OverallBanner
                    report={report}
                    upCount={upCount}
                    total={monitors.length}
                    error={loadError}
                    onRetry={handleRefresh}
                />

                {report && monitors.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatTile
                            label="Services up"
                            value={`${upCount}/${monitors.length}`}
                            Icon={ServerIcon}
                        />
                        <StatTile
                            label={
                                rangeActive
                                    ? intl.formatMessage({
                                          id: 'status.range.avgUptimeLabel',
                                          defaultMessage: 'Avg uptime · period',
                                      })
                                    : 'Avg uptime · 30d'
                            }
                            value={
                                rangeActive
                                    ? periodAvgUptime != null
                                        ? `${periodAvgUptime}%`
                                        : '—'
                                    : avgUptime != null
                                      ? `${avgUptime}%`
                                      : '—'
                            }
                            hint={rangeActive ? fmtRangeSpan(rangeParam) : undefined}
                            Icon={CheckCircleIcon}
                        />
                        <StatTile
                            label={
                                rangeActive
                                    ? intl.formatMessage({
                                          id: 'status.range.latencyLabel',
                                          defaultMessage: 'Latency · p50 (period)',
                                      })
                                    : 'Latency · p50'
                            }
                            value={p50 != null ? `${p50}ms` : '—'}
                            hint={
                                p50 == null
                                    ? rangeActive
                                        ? undefined
                                        : 'collecting…'
                                    : worstP95 != null
                                      ? `worst p95 ${worstP95}ms`
                                      : undefined
                            }
                            Icon={ClockIcon}
                        />
                    </div>
                )}

                {admin &&
                    (editingMonitor ? (
                        <MonitorForm
                            key={editingMonitor._id}
                            editing={editingMonitor}
                            existingGroups={existingGroups}
                            onSubmit={(values) => handleUpdate(editingMonitor, values)}
                            onCancel={() => setEditingMonitor(null)}
                        />
                    ) : (
                        <MonitorForm
                            key="new"
                            existingGroups={existingGroups}
                            onSubmit={handleCreate}
                        />
                    ))}

                <div className="mt-2">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-[var(--text)]">
                            Monitored services
                        </h2>
                        <UptimeLegend subDaily={subDaily} />
                    </div>

                    <div>
                        {groups.map((group) => (
                            <GroupSection
                                key={group.name}
                                group={group}
                                admin={admin}
                                onEdit={setEditingMonitor}
                                onDelete={handleDelete}
                                rangeActive={rangeActive}
                                subDaily={subDaily}
                            />
                        ))}

                        {ungrouped.map((monitor) => (
                            <MonitorRow
                                key={monitor._id}
                                monitor={monitor}
                                admin={admin}
                                onEdit={setEditingMonitor}
                                onDelete={handleDelete}
                                rangeActive={rangeActive}
                                subDaily={subDaily}
                            />
                        ))}

                        {report && monitors.length === 0 && (
                            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[var(--line)] px-6 py-16 text-center">
                                <ServerIcon className="h-8 w-8 text-[var(--muted)]" />
                                <p className="text-sm font-medium text-[var(--text)]">
                                    No monitored services yet
                                </p>
                                <p className="max-w-sm text-xs text-[var(--muted)]">
                                    Live status and 90-day uptime history will appear here once the
                                    first service is being watched.
                                </p>
                                {admin && (
                                    <a
                                        href="#monitor-form"
                                        className="mt-2 inline-flex items-center gap-2 rounded-md bg-[var(--text)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                                    >
                                        <PlusIcon className="h-4 w-4" /> Add your first monitor
                                    </a>
                                )}
                            </div>
                        )}

                        {!report && !loadError && (
                            <>
                                <MonitorSkeleton />
                                <MonitorSkeleton />
                                <MonitorSkeleton />
                            </>
                        )}
                    </div>
                </div>

                {hasMetrion && (
                    <p className="mt-4 font-mono text-2xs text-[var(--muted)]">
                        <FormattedMessage
                            id="status.footer.sources"
                            defaultMessage="Status data combines this site's own checks with uptime pulled from Metrion."
                        />
                    </p>
                )}

                <a
                    href={`${location.protocol}//${location.host.replace(/^status\./, '')}`}
                    className="mt-6 inline-flex items-center gap-1.5 text-xs text-[var(--muted)] transition hover:text-[var(--accent)]"
                >
                    <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to Woofi Developments
                </a>
            </div>
        </div>
    );
}
