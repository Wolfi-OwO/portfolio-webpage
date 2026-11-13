import { useEffect, useState } from 'react';

// What is running right now, read from the same /api/status the status page uses. It is the
// proof for the headline, so it shows measured numbers (30-day uptime, median response time)
// and nothing is invented: when the request fails the block is left out entirely.
const LABEL = {
    Burrow: 'private file drive',
    Metrion: 'infrastructure metrics',
    'Network Visualizer': 'network simulator',
    Nutrilens: 'nutrition tracking',
    Portfolio: 'this site',
    'ML Visualizer': 'machine learning lessons',
};
const ORDER = [
    'Portfolio',
    'Burrow',
    'Metrion',
    'Network Visualizer',
    'Nutrilens',
    'ML Visualizer',
];

function median(group) {
    const v = group.monitors.map((m) => m.latencyMs).filter((n) => Number.isFinite(n));
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

export default function RunningNow() {
    const [data, setData] = useState(null);

    useEffect(() => {
        let alive = true;
        fetch('/api/status')
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => alive && setData(d))
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    if (!data?.groups?.length) return null;

    const rows = [...data.groups].sort(
        (a, b) => (ORDER.indexOf(a.name) + 1 || 99) - (ORDER.indexOf(b.name) + 1 || 99),
    );
    const newest = rows
        .flatMap((g) => g.monitors.map((m) => Date.parse(m.lastCheckedAt)))
        .filter(Number.isFinite)
        .sort((a, b) => b - a)[0];
    const checked = newest
        ? new Date(newest).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <aside className="now" aria-label="Services running right now">
            <div className="now-h">
                <span>running now</span>
                <span>30-day uptime · last response</span>
            </div>
            <ul>
                {rows.map((g) => (
                    <li key={g.name}>
                        <span
                            className={`now-dot ${g.status === 'operational' ? 'ok' : 'bad'}`}
                            role="img"
                            aria-label={g.status}
                        />
                        <b>{g.name}</b>
                        <span className="now-d">{LABEL[g.name] ?? ''}</span>
                        <span className="now-n">
                            {g.uptime?.d30 != null ? `${g.uptime.d30}%` : ''}
                            {median(g) != null ? ` · ${median(g)} ms` : ''}
                        </span>
                    </li>
                ))}
            </ul>
            <div className="now-f">
                <span>
                    {checked ? `checked ${checked}` : 'live'} ·{' '}
                    {data.status === 'operational' ? 'all operational' : data.status}
                </span>
                <a href="https://status.woofi-developments.at">status page</a>
            </div>
        </aside>
    );
}
