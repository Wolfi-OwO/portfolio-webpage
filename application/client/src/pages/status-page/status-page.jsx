import { useCallback, useEffect, useState } from 'react';
import {
    ArrowLeftIcon,
    ArrowPathIcon,
    ArrowTopRightOnSquareIcon,
    CheckCircleIcon,
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

const BADGE = {
    operational: { label: 'Operational', color: 'var(--live)', Icon: CheckCircleIcon },
    down: { label: 'Down', color: 'var(--down)', Icon: XCircleIcon },
    pending: { label: 'Pending', color: 'var(--muted)', Icon: ExclamationTriangleIcon },
    // A healthy scale-to-zero app: still up, just resting. Distinct label, same green.
    idle: { label: 'Idle', color: 'var(--live)', Icon: MoonIcon },
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

function fmtDuration(ms) {
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours && minutes) return `${hours} hrs ${minutes} mins`;
    if (hours) return `${hours} hrs`;
    return `${minutes} mins`;
}

function summarizeHistory(history) {
    const known = history.filter((day) => day.severity !== 'no-data');
    if (!known.length) return 'No uptime data yet';
    const badDays = known.filter((day) => day.severity !== 'operational').length;
    return `${known.length - badDays} of ${known.length} days fully operational`;
}

function uptimeColor(pct) {
    if (pct >= 99.9) return 'var(--live)';
    if (pct >= 99) return '#c98a1a';
    return 'var(--down)';
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
        return (
            <span
                className={`inline-flex shrink-0 ${dim} rounded-full`}
                style={{ background: 'color-mix(in srgb, var(--live) 70%, transparent)' }}
            />
        );
    }

    const color = status === 'operational' ? 'var(--live)' : 'var(--muted)';
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

// One day's bar with a hover popover: date, severity, and downtime that day.
function DayBar({ day }) {
    const info = SEVERITY[day.severity] ?? SEVERITY['no-data'];

    return (
        <div className="group/bar relative flex-1" aria-hidden="true">
            <div className="h-7 rounded-[2px] transition-colors" style={{ background: info.bar }} />

            <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/bar:opacity-100">
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 shadow-lg">
                    <p className="text-xs font-semibold text-[var(--text)]">{fmtDate(day.day)}</p>

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

function UptimeBar({ history }) {
    return (
        <div
            className="flex h-7 items-stretch gap-[2px]"
            role="img"
            aria-label={summarizeHistory(history)}
        >
            {history.map((day, index) => (
                <DayBar key={index} day={day} />
            ))}
        </div>
    );
}

function UptimeLegend() {
    const items = [
        ['operational', SEVERITY.operational.bar],
        ['minor', SEVERITY.minor.bar],
        ['major', SEVERITY.major.bar],
        ['critical', SEVERITY.critical.bar],
        ['no data', SEVERITY['no-data'].bar],
    ];
    return (
        <div className="hidden items-center gap-3 font-mono text-2xs text-[var(--muted)] sm:flex">
            {items.map(([label, bar]) => (
                <span key={label} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: bar }} /> {label}
                </span>
            ))}
        </div>
    );
}

function StatTile({ label, value, Icon }) {
    return (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center gap-1.5 text-[var(--muted)]">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-medium">{label}</p>
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-[var(--text)]">{value}</p>
        </div>
    );
}

function OverallBanner({ report, upCount, total }) {
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

    const allOperational = report.status === 'operational';
    const label = allOperational
        ? 'All systems operational'
        : upCount === 0 && total > 0
          ? 'Major outage'
          : 'Partial outage';
    const tint = allOperational ? 'var(--live)' : 'var(--down)';

    return (
        <div
            className="mb-6 flex items-center gap-4 rounded-lg border p-5"
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
    );
}

// The subtitle line under a monitor name. Container-app monitors read
// "Azure Container App", plus the URL if one exists, plus a scale-to-zero note.
function MonitorMeta({ monitor }) {
    const linkCls =
        'inline-flex min-w-0 max-w-full items-center gap-1 font-mono text-xs text-[var(--muted)] transition hover:text-[var(--accent)]';

    if (monitor.containerApp?.name) {
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
                {scaled && ' · Scaled To Zero Revisions'}
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

    return null;
}

function MonitorRow({ monitor, admin, onEdit, onDelete }) {
    const status = displayStatus(monitor);
    const badge = BADGE[status] ?? BADGE.pending;
    const rowTitle =
        monitor.status === 'down'
            ? monitor.lastError || 'Down — no further error details available'
            : undefined;

    return (
        <div className="border-b border-[var(--line)] py-5 last:border-0" title={rowTitle}>
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

            <UptimeBar history={monitor.history} />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-2xs">
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span style={{ color: uptimeColor(monitor.uptime.d30) }}>
                        {monitor.uptime.d30}% · 30d
                    </span>
                    <span style={{ color: uptimeColor(monitor.uptime.d7) }}>
                        {monitor.uptime.d7}% · 7d
                    </span>
                    <span style={{ color: uptimeColor(monitor.uptime.h24) }}>
                        {monitor.uptime.h24}% · 24h
                    </span>
                </span>
                <span className="flex items-center gap-1.5 text-[var(--muted)]">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {monitor.status === 'pending'
                        ? 'Checking…'
                        : `checked ${fmtRelative(monitor.lastCheckedAt)}`}
                </span>
            </div>

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
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isContainerApp = Boolean(editing?.containerApp?.name);

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');

        if (!name.trim() || (!url.trim() && !isContainerApp)) {
            setError('Name and URL are required.');
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit({ name: name.trim(), url: url.trim(), group: group.trim() });
            if (!editing) {
                setName('');
                setUrl('');
                setGroup('');
            }
        } catch (err) {
            setError(err.message || 'Failed to save monitor.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form
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
function GroupSection({ group, admin, onEdit, onDelete }) {
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
                >
                    <badge.Icon className="h-4 w-4" /> {badge.label}
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-2xs">
                <span style={{ color: uptimeColor(group.uptime.d30) }}>
                    {group.uptime.d30}% · 30d avg
                </span>
                <span style={{ color: uptimeColor(group.uptime.d7) }}>
                    {group.uptime.d7}% · 7d avg
                </span>
                <span style={{ color: uptimeColor(group.uptime.h24) }}>
                    {group.uptime.h24}% · 24h avg
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
                    />
                ))}
            </div>
        </div>
    );
}

export default function StatusPage() {
    usePageMeta('Status', 'Live uptime status for Woofi Developments and its monitored services.');

    const [report, setReport] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [admin] = useState(() => isAdmin());
    const [editingMonitor, setEditingMonitor] = useState(null);

    const load = useCallback(() => {
        return fetch('/api/status')
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => {
                if (data) setReport(data);
            })
            .catch(() => {
                // keep the last known report if a poll fails
            });
    }, []);

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

    async function handleCreate({ name, url, group }) {
        const response = await fetch('/api/monitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ name, url, group }),
        });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message || 'Failed to add monitor.');
        }
        await load();
    }

    async function handleUpdate(monitor, { name, url, group }) {
        const response = await fetch(`/api/monitors/${monitor._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ name, url, group }),
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

    const upCount = monitors.filter((m) => m.status === 'operational').length;
    const avgUptime = monitors.length
        ? round1(monitors.reduce((sum, m) => sum + m.uptime.d30, 0) / monitors.length)
        : null;
    const latencies = monitors.map((m) => m.latencyMs).filter((ms) => ms != null);
    const avgLatency = latencies.length
        ? Math.round(latencies.reduce((sum, ms) => sum + ms, 0) / latencies.length)
        : null;

    return (
        <div className="min-h-screen bg-[var(--bg)] bg-white text-[var(--text)] text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
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

                <OverallBanner report={report} upCount={upCount} total={monitors.length} />

                {report && monitors.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatTile
                            label="Services up"
                            value={`${upCount}/${monitors.length}`}
                            Icon={ServerIcon}
                        />
                        <StatTile
                            label="Avg uptime · 30d"
                            value={avgUptime != null ? `${avgUptime}%` : '—'}
                            Icon={CheckCircleIcon}
                        />
                        <StatTile
                            label="Avg latency"
                            value={avgLatency != null ? `${avgLatency}ms` : '—'}
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
                        <UptimeLegend />
                    </div>

                    <div>
                        {groups.map((group) => (
                            <GroupSection
                                key={group.name}
                                group={group}
                                admin={admin}
                                onEdit={setEditingMonitor}
                                onDelete={handleDelete}
                            />
                        ))}

                        {ungrouped.map((monitor) => (
                            <MonitorRow
                                key={monitor._id}
                                monitor={monitor}
                                admin={admin}
                                onEdit={setEditingMonitor}
                                onDelete={handleDelete}
                            />
                        ))}

                        {report && monitors.length === 0 && (
                            <div className="flex flex-col items-center gap-2 py-14 text-center">
                                <ServerIcon className="h-8 w-8 text-[var(--line)]" />
                                <p className="text-sm text-[var(--muted)]">
                                    No monitors configured yet.
                                </p>
                            </div>
                        )}

                        {!report && (
                            <>
                                <MonitorSkeleton />
                                <MonitorSkeleton />
                                <MonitorSkeleton />
                            </>
                        )}
                    </div>
                </div>

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
