import { useCallback, useEffect, useState } from 'react';
import {
    ArrowLeftIcon,
    ArrowPathIcon,
    ArrowTopRightOnSquareIcon,
    BoltIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
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
    operational: { label: 'Operational', cls: 'text-emerald-600 dark:text-emerald-400', Icon: CheckCircleIcon },
    down: { label: 'Down', cls: 'text-red-600 dark:text-red-400', Icon: XCircleIcon },
    pending: { label: 'Pending', cls: 'text-amber-600 dark:text-amber-400', Icon: ExclamationTriangleIcon },
};

// Discord-style severity tiers for a day's bar — the longer a service was
// down that day, the darker red it gets, instead of a flat binary up/down.
const SEVERITY = {
    operational: {
        label: 'Operational',
        barCls: 'bg-emerald-500',
        Icon: CheckCircleIcon,
        iconCls: 'text-emerald-500',
        chipCls: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    minor: {
        label: 'Minor outage',
        barCls: 'bg-red-300',
        Icon: ExclamationTriangleIcon,
        iconCls: 'text-red-400',
        chipCls: 'bg-red-50 dark:bg-red-500/10',
    },
    major: {
        label: 'Partial outage',
        barCls: 'bg-red-500',
        Icon: ExclamationTriangleIcon,
        iconCls: 'text-red-500',
        chipCls: 'bg-red-50 dark:bg-red-500/10',
    },
    critical: {
        label: 'Major outage',
        barCls: 'bg-red-800',
        Icon: XCircleIcon,
        iconCls: 'text-red-700 dark:text-red-500',
        chipCls: 'bg-red-50 dark:bg-red-500/10',
    },
    'no-data': {
        label: 'No data',
        barCls: 'bg-slate-200 dark:bg-slate-800',
        Icon: ExclamationTriangleIcon,
        iconCls: 'text-slate-400',
        chipCls: 'bg-slate-50 dark:bg-slate-800/50',
    },
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
    return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
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
    const known = history.filter(day => day.severity !== 'no-data');
    if (!known.length) return 'No uptime data yet';
    const badDays = known.filter(day => day.severity !== 'operational').length;
    return `${known.length - badDays} of ${known.length} days fully operational`;
}

function uptimeTone(pct) {
    if (pct >= 99.9) return 'text-emerald-600 dark:text-emerald-400';
    if (pct >= 99) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

// A small live indicator: pulses for operational/pending, solid for down —
// so status reads at a glance without relying on color alone (paired with text elsewhere).
function StatusDot({ status, size = 'sm' }) {
    const dim = size === 'lg' ? 'h-3 w-3' : 'h-2 w-2';

    if (status === 'down') {
        return <span className={`inline-flex shrink-0 ${dim} rounded-full bg-red-500`} />;
    }

    const tone = status === 'operational' ? 'emerald' : 'amber';
    return (
        <span className={`relative inline-flex shrink-0 ${dim}`}>
            <span
                className={`absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-${tone}-400 opacity-75`}
            />
            <span className={`relative inline-flex ${dim} rounded-full bg-${tone}-500`} />
        </span>
    );
}

// One day's bar, with a Discord-style popover card on hover: date, severity
// (colored chip + icon), and how long it was down that day.
function DayBar({ day }) {
    const info = SEVERITY[day.severity] ?? SEVERITY['no-data'];

    return (
        <div className="group/bar relative flex-1" aria-hidden="true">
            <div className={`h-7 rounded-[2px] transition-colors ${info.barCls}`} />

            <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/bar:opacity-100">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-xs font-semibold text-slate-950 dark:text-white">{fmtDate(day.day)}</p>

                    <div className={`mt-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${info.chipCls}`}>
                        <info.Icon className={`h-4 w-4 shrink-0 ${info.iconCls}`} />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{info.label}</span>
                        {day.downMs > 0 && (
                            <span className="ml-auto shrink-0 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                {fmtDuration(day.downMs)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1.5 rotate-45 border-b border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
            </div>
        </div>
    );
}

function UptimeBar({ history }) {
    return (
        <div className="flex h-7 items-stretch gap-[2px]" role="img" aria-label={summarizeHistory(history)}>
            {history.map((day, index) => (
                <DayBar key={index} day={day} />
            ))}
        </div>
    );
}

function UptimeLegend() {
    return (
        <div className="hidden items-center gap-3 font-mono text-[11px] text-slate-400 dark:text-slate-500 sm:flex">
            <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-500" /> operational
            </span>
            <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-red-300" /> minor
            </span>
            <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-red-500" /> major
            </span>
            <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-red-800" /> critical
            </span>
            <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-slate-200 dark:bg-slate-800" /> no data
            </span>
        </div>
    );
}

function StatTile({ label, value, Icon }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <Icon className="h-4 w-4" />
                <p className="text-xs font-medium uppercase tracking-wider">{label}</p>
            </div>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
        </div>
    );
}

function OverallBanner({ report, upCount, total }) {
    if (!report) {
        return (
            <div className="mb-6 flex animate-pulse items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                <span className="h-3 w-3 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700" />
                <p className="font-mono text-sm text-slate-400 dark:text-slate-600">Connecting to status service…</p>
            </div>
        );
    }

    const allOperational = report.status === 'operational';
    const label = allOperational ? 'All Systems Operational' : upCount === 0 && total > 0 ? 'Major Outage' : 'Partial Outage Detected';

    return (
        <div
            className={`mb-6 flex items-center gap-4 rounded-2xl border p-5 ${
                allOperational
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                    : 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
            }`}
        >
            <StatusDot status={report.status} size="lg" />
            <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-slate-950 dark:text-white">{label}</p>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    checks every {Math.round(report.checkIntervalMs / 1000)}s
                </p>
            </div>
        </div>
    );
}

function MonitorRow({ monitor, admin, onEdit, onDelete }) {
    const badge = BADGE[monitor.status] ?? BADGE.pending;
    // Hovering anywhere on the row surfaces why it's down, not just the inline error box below.
    const rowTitle =
        monitor.status === 'down' ? monitor.lastError || 'Down — no further error details available' : undefined;

    return (
        <div className="py-5 border-b border-slate-200 last:border-0 dark:border-slate-800" title={rowTitle}>
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <StatusDot status={monitor.status} />

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{monitor.name}</p>
                        <a
                            href={monitor.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex min-w-0 max-w-full items-center gap-1 font-mono text-xs text-slate-500 dark:text-slate-400"
                        >
                            <span className="truncate underline-offset-2 group-hover:underline">{monitor.url}</span>
                            <ArrowTopRightOnSquareIcon className="h-3 w-3 shrink-0 opacity-0 transition group-hover:opacity-100" />
                        </a>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {monitor.latencyMs != null && (
                        <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{monitor.latencyMs}ms</span>
                    )}

                    <span className={`flex items-center gap-1.5 text-xs font-medium ${badge.cls}`}>
                        <badge.Icon className="h-4 w-4" /> {badge.label}
                    </span>

                    {admin && (
                        <>
                            <button
                                type="button"
                                onClick={() => onEdit(monitor)}
                                aria-label={`Edit ${monitor.name}`}
                                title="Edit"
                                className="cursor-pointer rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(monitor)}
                                aria-label={`Remove ${monitor.name}`}
                                title="Remove"
                                className="cursor-pointer rounded-full p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <UptimeBar history={monitor.history} />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[11px]">
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className={uptimeTone(monitor.uptime.d30)}>{monitor.uptime.d30}% · 30d</span>
                    <span className={uptimeTone(monitor.uptime.d7)}>{monitor.uptime.d7}% · 7d</span>
                    <span className={uptimeTone(monitor.uptime.h24)}>{monitor.uptime.h24}% · 24h</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {monitor.status === 'pending' ? 'Checking…' : `checked ${fmtRelative(monitor.lastCheckedAt)}`}
                </span>
            </div>

            {monitor.status === 'down' && monitor.lastError && (
                <p
                    title={monitor.lastError}
                    className="mt-2 truncate rounded-lg bg-red-50 px-3 py-2 font-mono text-[11px] text-red-700 dark:bg-red-500/10 dark:text-red-300"
                >
                    {monitor.lastError}
                </p>
            )}
        </div>
    );
}

function MonitorSkeleton() {
    return (
        <div className="animate-pulse py-5 border-b border-slate-200 last:border-0 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-14 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-7 rounded bg-slate-100 dark:bg-slate-900" />
        </div>
    );
}

function MonitorForm({ editing, existingGroups, onSubmit, onCancel }) {
    const [name, setName] = useState(editing?.name ?? '');
    const [url, setUrl] = useState(editing?.url ?? '');
    const [group, setGroup] = useState(editing?.group ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');

        if (!name.trim() || !url.trim()) {
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
            className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
        >
            <p className="basis-full font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
                Admin · {editing ? 'Edit Monitor' : 'Add Monitor'}
            </p>

            <label className="flex-1 basis-40">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Name
                </span>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="My Website"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 placeholder-slate-400 transition focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:ring-white/10"
                />
            </label>

            <label className="flex-[2] basis-64">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    URL
                </span>
                <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm text-slate-950 placeholder-slate-400 transition focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:ring-white/10"
                />
            </label>

            <label className="flex-1 basis-40">
                <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Group (optional)
                </span>
                <input
                    list="monitor-groups"
                    type="text"
                    value={group}
                    onChange={e => setGroup(e.target.value)}
                    placeholder="e.g. ML Visualizer"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 placeholder-slate-400 transition focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:ring-white/10"
                />
                <datalist id="monitor-groups">
                    {existingGroups?.map(g => <option key={g} value={g} />)}
                </datalist>
            </label>

            <div className="flex items-center gap-2">
                {editing && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/30 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus-visible:ring-white/30"
                >
                    <PlusIcon className="h-4 w-4" />
                    {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Monitor'}
                </button>
            </div>

            {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
    );
}

// A named group of monitors — shows a summarized (averaged) uptime and a
// worst-of status up top, with each member's own row nested underneath.
function GroupSection({ group, admin, onEdit, onDelete }) {
    const badge = BADGE[group.status] ?? BADGE.pending;

    return (
        <div className="border-b border-slate-200 py-5 last:border-0 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <StatusDot status={group.status} />
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{group.name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {group.monitors.length} services
                    </span>
                </div>

                <span className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${badge.cls}`}>
                    <badge.Icon className="h-4 w-4" /> {badge.label}
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
                <span className={uptimeTone(group.uptime.d30)}>{group.uptime.d30}% · 30d avg</span>
                <span className={uptimeTone(group.uptime.d7)}>{group.uptime.d7}% · 7d avg</span>
                <span className={uptimeTone(group.uptime.h24)}>{group.uptime.h24}% · 24h avg</span>
            </div>

            <div className="mt-3 ml-2 space-y-1 border-l-2 border-slate-100 pl-4 dark:border-slate-900">
                {group.monitors.map(monitor => (
                    <MonitorRow key={monitor._id} monitor={monitor} admin={admin} onEdit={onEdit} onDelete={onDelete} />
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
            .then(response => (response.ok ? response.json() : null))
            .then(data => {
                if (data) setReport(data);
            })
            .catch(() => {
                // status page stays on the last known report if a poll fails
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
        setEditingMonitor(current => (current?._id === monitor._id ? null : current));
        await load();
    }

    const groups = report?.groups ?? [];
    const ungrouped = report?.ungrouped ?? [];
    const monitors = [...groups.flatMap(g => g.monitors), ...ungrouped];
    const existingGroups = groups.map(g => g.name);

    const upCount = monitors.filter(m => m.status === 'operational').length;
    const avgUptime = monitors.length
        ? round1(monitors.reduce((sum, m) => sum + m.uptime.d30, 0) / monitors.length)
        : null;
    const latencies = monitors.map(m => m.latencyMs).filter(ms => ms != null);
    const avgLatency = latencies.length
        ? Math.round(latencies.reduce((sum, ms) => sum + ms, 0) / latencies.length)
        : null;

    return (
        <div className="space-y-10 py-10 lg:py-14">
            <section className="mx-auto max-w-4xl px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <div>
                        <p className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                            system.status()
                        </p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Status</h1>
                    </div>

                    <div className="flex-1" />

                    <button
                        type="button"
                        onClick={handleRefresh}
                        aria-label="Refresh"
                        title="Refresh"
                        className="cursor-pointer rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <OverallBanner report={report} upCount={upCount} total={monitors.length} />

                {report && monitors.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatTile label="Services Up" value={`${upCount}/${monitors.length}`} Icon={ServerIcon} />
                        <StatTile
                            label="Avg Uptime · 30d"
                            value={avgUptime != null ? `${avgUptime}%` : '—'}
                            Icon={ChartBarIcon}
                        />
                        <StatTile
                            label="Avg Latency"
                            value={avgLatency != null ? `${avgLatency}ms` : '—'}
                            Icon={BoltIcon}
                        />
                    </div>
                )}

                {admin && (
                    editingMonitor ? (
                        <MonitorForm
                            key={editingMonitor._id}
                            editing={editingMonitor}
                            existingGroups={existingGroups}
                            onSubmit={values => handleUpdate(editingMonitor, values)}
                            onCancel={() => setEditingMonitor(null)}
                        />
                    ) : (
                        <MonitorForm key="new" existingGroups={existingGroups} onSubmit={handleCreate} />
                    )
                )}

                <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-900">
                        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
                            Monitored Services
                        </p>
                        <UptimeLegend />
                    </div>

                    <div className="px-6">
                        {groups.map(group => (
                            <GroupSection
                                key={group.name}
                                group={group}
                                admin={admin}
                                onEdit={setEditingMonitor}
                                onDelete={handleDelete}
                            />
                        ))}

                        {ungrouped.map(monitor => (
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
                                <ServerIcon className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">No monitors configured yet.</p>
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
                    className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                    <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to Woofi Developments
                </a>
            </section>
        </div>
    );
}
