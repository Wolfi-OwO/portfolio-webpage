import { useCallback, useEffect, useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    ArrowPathIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { authHeaders, isAdmin } from '../../utils/auth.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

const POLL_MS = 15000;
const HISTORY_LENGTH = 90;

const BADGE = {
    operational: { label: 'Operational', cls: 'text-emerald-600 dark:text-emerald-400', Icon: CheckCircleIcon },
    down: { label: 'Down', cls: 'text-red-600 dark:text-red-400', Icon: XCircleIcon },
    pending: { label: 'Pending', cls: 'text-amber-600 dark:text-amber-400', Icon: ExclamationTriangleIcon },
};

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

function UptimeBar({ history }) {
    const bars = Array.from({ length: HISTORY_LENGTH }, (_, i) => history[history.length - HISTORY_LENGTH + i]);
    return (
        <div className="flex h-6 items-stretch gap-[2px]">
            {bars.map((bar, index) => (
                <div
                    key={index}
                    title={bar ? (bar.ok ? 'Operational' : 'Down') : 'No data'}
                    className={`flex-1 rounded-[1px] ${
                        bar ? (bar.ok ? 'bg-emerald-500' : 'bg-red-500') : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                />
            ))}
        </div>
    );
}

function MonitorRow({ monitor, admin, onDelete }) {
    const badge = BADGE[monitor.status] ?? BADGE.pending;

    return (
        <div className="py-5 border-b border-slate-200 last:border-0 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{monitor.name}</p>
                    <a
                        href={monitor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
                    >
                        {monitor.url}
                    </a>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${badge.cls}`}>
                        <badge.Icon className="h-4 w-4" /> {badge.label}
                    </span>

                    {admin && (
                        <button
                            type="button"
                            onClick={() => onDelete(monitor)}
                            aria-label={`Remove ${monitor.name}`}
                            title="Remove"
                            className="rounded-full p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            <UptimeBar history={monitor.history} />

            <div className="mt-1.5 flex flex-wrap justify-between gap-x-4 gap-y-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                <span>{monitor.uptime.d30}% · 30d</span>
                <span>{monitor.uptime.d7}% · 7d</span>
                <span>{monitor.uptime.h24}% · 24h</span>
                <span>
                    {monitor.status === 'pending' ? 'Checking…' : `Checked ${fmtRelative(monitor.lastCheckedAt)}`}
                    {monitor.latencyMs != null && ` · ${monitor.latencyMs}ms`}
                </span>
            </div>
        </div>
    );
}

function AddMonitorForm({ onCreate }) {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
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
            await onCreate({ name: name.trim(), url: url.trim() });
            setName('');
            setUrl('');
        } catch (err) {
            setError(err.message || 'Failed to add monitor.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
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
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 placeholder-slate-400 transition focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:ring-white/10"
                />
            </label>

            <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
                <PlusIcon className="h-4 w-4" />
                {submitting ? 'Adding…' : 'Add Monitor'}
            </button>

            {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
    );
}

export default function StatusPage() {
    usePageMeta('Status', 'Live uptime status for Woofi Developments and its monitored services.');

    const [report, setReport] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [admin] = useState(() => isAdmin());

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

    async function handleCreate({ name, url }) {
        const response = await fetch('/api/monitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ name, url }),
        });
        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message || 'Failed to add monitor.');
        }
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
        await load();
    }

    const overall = report ? (BADGE[report.status] ?? BADGE.operational) : BADGE.operational;
    const allOperational = !report || report.status === 'operational';

    return (
        <div className="space-y-10 py-10 lg:py-14">
            <section className="mx-auto max-w-3xl px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Status</h1>
                    <div className="flex-1" />
                    <button
                        type="button"
                        onClick={handleRefresh}
                        aria-label="Refresh"
                        title="Refresh"
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                        <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div
                    className={`mb-6 flex items-center gap-3 rounded-2xl border p-5 ${
                        allOperational
                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
                            : 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
                    }`}
                >
                    <overall.Icon className={`h-7 w-7 shrink-0 ${overall.cls}`} />
                    <p className="text-base font-semibold text-slate-950 dark:text-white">
                        {allOperational ? 'All Systems Operational' : overall.label}
                    </p>
                </div>

                {admin && <AddMonitorForm onCreate={handleCreate} />}

                <div className="rounded-[2rem] border border-slate-200 bg-white px-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    {report?.monitors.map(monitor => (
                        <MonitorRow key={monitor._id} monitor={monitor} admin={admin} onDelete={handleDelete} />
                    ))}
                    {report && report.monitors.length === 0 && (
                        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                            No monitors configured yet.
                        </p>
                    )}
                    {!report && <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading status…</p>}
                </div>
            </section>
        </div>
    );
}
