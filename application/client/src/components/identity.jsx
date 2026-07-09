import { useEffect, useState } from 'react';
import { SOCIALS } from '../utils/identity.js';

const iconButtonCls =
    'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] motion-reduce:hover:translate-y-0';

/** Icon row of social links. Discord copies its handle; the rest are real links. */
export function SocialRow() {
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        if (!copied) return undefined;
        const id = setTimeout(() => setCopied(null), 1600);
        return () => clearTimeout(id);
    }, [copied]);

    function handleCopy(social) {
        navigator.clipboard.writeText(social.copy).then(
            () => setCopied(social.key),
            () => setCopied(null),
        );
    }

    return (
        <ul className="flex flex-wrap items-center gap-2.5">
            {SOCIALS.map(social => (
                <li key={social.key} className="relative">
                    {social.href ? (
                        <a
                            href={social.href}
                            target={social.href.startsWith('mailto:') ? undefined : '_blank'}
                            rel={social.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                            aria-label={`${social.label}: ${social.value}`}
                            title={social.label}
                            className={iconButtonCls}
                        >
                            <social.Icon className="h-[18px] w-[18px]" />
                        </a>
                    ) : (
                        <button
                            type="button"
                            onClick={() => handleCopy(social)}
                            aria-label={`Copy ${social.label} handle ${social.value}`}
                            title={`Copy ${social.label} handle`}
                            className={`${iconButtonCls} cursor-pointer`}
                        >
                            <social.Icon className="h-[18px] w-[18px]" />
                        </button>
                    )}

                    {copied === social.key && (
                        <span
                            role="status"
                            className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--text)] px-2 py-1 font-mono text-[10px] text-[var(--bg)]"
                        >
                            Copied
                        </span>
                    )}
                </li>
            ))}
        </ul>
    );
}

/**
 * The signature element: the site reporting on itself. Reads the same /api/status
 * the status page uses, so the hero shows real production state instead of
 * hand-written numbers. Degrades to a neutral line — no layout shift — if the
 * API can't be reached.
 */
export function LiveStatusLine() {
    const [state, setState] = useState({ loading: true, failed: false, report: null });

    useEffect(() => {
        let alive = true;

        fetch('/api/status')
            .then(response => (response.ok ? response.json() : Promise.reject(new Error('unavailable'))))
            .then(report => alive && setState({ loading: false, failed: false, report }))
            .catch(() => alive && setState({ loading: false, failed: true, report: null }));

        return () => {
            alive = false;
        };
    }, []);

    const { loading, failed, report } = state;

    const monitors = report
        ? [...(report.groups ?? []).flatMap(group => group.monitors ?? []), ...(report.ungrouped ?? [])]
        : [];
    const operational = report?.status === 'operational';
    const uptime30d = monitors.length
        ? Math.round((monitors.reduce((sum, m) => sum + (m.uptime?.d30 ?? 0), 0) / monitors.length) * 10) / 10
        : null;

    const dot = loading || failed ? 'bg-[var(--muted)]' : operational ? 'bg-[var(--live)]' : 'bg-red-500';
    const label = loading
        ? 'checking services…'
        : failed
          ? 'status unavailable'
          : operational
            ? 'all systems operational'
            : 'service disruption';

    return (
        <a
            href="/status.html"
            className="group flex items-center gap-2.5 font-mono text-xs text-[var(--muted)] transition hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
            <span className="relative flex h-2 w-2 shrink-0">
                {!loading && !failed && operational && (
                    <span
                        className={`absolute inline-flex h-full w-full rounded-full ${dot} opacity-70 motion-safe:animate-ping`}
                    />
                )}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
            </span>

            <span className="truncate">
                {label}
                {!loading && !failed && monitors.length > 0 && (
                    <span className="opacity-70">
                        {' · '}
                        {monitors.length} services
                        {uptime30d != null && ` · ${uptime30d}% 30d`}
                    </span>
                )}
            </span>

            <span aria-hidden="true" className="ml-auto shrink-0 opacity-0 transition group-hover:opacity-100">
                →
            </span>
        </a>
    );
}
